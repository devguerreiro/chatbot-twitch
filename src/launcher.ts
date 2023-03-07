import { TwitchTokenDetails } from "./models/token.model";
import { ChatBotConfig } from "./models/config.model";
import { ICommand } from "./models/command.model";
import { TwitchTokenResponseValidator } from "./validators/tokenValidator";
import {
  MalformedTwitchRequestError,
  NoTwitchResponseError,
  TwitchResponseError,
} from "./exceptions/response";
import { CommandHandlerExecutionError } from "./exceptions/command";

export class TwitchChatBot {
  tmi = require("tmi.js");
  fs = require("fs");

  public twitchClient: any;
  private tokenDetails!: TwitchTokenDetails;

  constructor(private config: ChatBotConfig) {}

  async launch() {
    this.tokenDetails = await this.fetchAccessToken();

    this.twitchClient = new this.tmi.Client(
      this.buildConnectionConfig(
        this.config.twitchChannel,
        this.config.twitchUser,
        this.tokenDetails.access_token
      )
    );
    this.setupBotBehavior();
    this.twitchClient.connect();
  }

  private async fetchRefreshToken(): Promise<TwitchTokenDetails> {
    const axios = require("axios");
    const db = require("../db.json");
    console.log("Fetching Twitch OAuth Refresh Token");
    return axios({
      method: "post",
      url: this.config.twitchTokenEndpoint,
      params: {
        client_id: this.config.twitchClientId,
        client_secret: this.config.twitchClientSecret,
        refresh_token: db.oauth.refresh_token,
        grant_type: "refresh_token",
      },
      responseType: "json",
    })
      .then(async (response: any) => {
        // handle success
        const token = await TwitchTokenResponseValidator.parseResponse(
          response.data
        );
        this.fs.writeFileSync(
          "db.json",
          JSON.stringify({ oauth: response.data })
        );
        return token;
      })
      .catch(function (error: any) {
        console.log("Failed to get Twitch OAuth Refresh Token");
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new TwitchResponseError(JSON.stringify(error.response.data));
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          throw new NoTwitchResponseError(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new MalformedTwitchRequestError(error.request);
        }
      });
  }

  private async fetchAccessToken(): Promise<TwitchTokenDetails> {
    const axios = require("axios");
    console.log("Fetching Twitch OAuth Token");
    return axios({
      method: "post",
      url: this.config.twitchTokenEndpoint,
      params: {
        client_id: this.config.twitchClientId,
        client_secret: this.config.twitchClientSecret,
        code: this.config.twitchAuthorizationCode,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost",
      },
      responseType: "json",
    })
      .then(async (response: any) => {
        // handle success
        const token = await TwitchTokenResponseValidator.parseResponse(
          response.data
        );
        this.fs.writeFileSync(
          "db.json",
          JSON.stringify({ oauth: response.data })
        );
        return token;
      })
      .catch((error: any) => {
        console.log("Failed to get Twitch OAuth Token");
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status == 400) {
            return this.fetchRefreshToken();
          }
          throw new TwitchResponseError(JSON.stringify(error.response.data));
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          throw new NoTwitchResponseError(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new MalformedTwitchRequestError(error.request);
        }
      });
  }

  private buildConnectionConfig(
    channel: string,
    username: string,
    accessToken: string
  ) {
    return {
      options: { debug: true },
      connection: {
        secure: true,
        reconnect: true,
      },
      identity: {
        username: `${username}`,
        password: `oauth:${accessToken}`,
      },
      channels: [`${channel}`],
    };
  }

  private setupBotBehavior() {
    this.twitchClient.on(
      "message",
      (channel: any, tags: any, message: any, self: any) => {
        // Ignore messages from itself.
        // if (self) return;
        console.log({ channel, tags, message, self });

        const match = message.match(/^(\!\w+)\s?(\w+)?/);
        if (match) {
          const command = match[1];
          const arg = match[2];

          const commandHandler = this.getCommand(command);

          try {
            if (commandHandler !== null) commandHandler.handler(arg);
          } catch (err: unknown) {
            if (err instanceof CommandHandlerExecutionError) {
              console.log(err.message);
            }
          }
        }
      }
    );
  }

  private getCommand(command: string): ICommand | null {
    try {
      return require(`./commands/${command}`) as ICommand;
    } catch (err: unknown) {
      return null;
    }
  }
}
