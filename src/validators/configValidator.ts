import { validate } from "class-validator";
import { InvalidTwitchConfigError } from "../exceptions/config";
import { ChatBotConfig } from "../models/config.model";

export class ConfigValidator {
  public static async readConfig(configPath: string): Promise<ChatBotConfig> {
    const configJson = JSON.parse(require("fs").readFileSync(configPath));

    try {
      console.info("Validating Config...");

      let completeConfig = new ChatBotConfig(
        configJson.twitch.token_endpoint,
        configJson.twitch.username,
        configJson.twitch.client_id,
        configJson.twitch.client_secret,
        configJson.twitch.authorization_code,
        configJson.twitch.channel
      );
      let completeConfigErrors = await validate(completeConfig);

      if (completeConfigErrors.length > 0) {
        throw new InvalidTwitchConfigError(`The provided mothership config is not valid, 
               here are the issues: ${completeConfigErrors.join()}`);
      }

      console.info("Config is valid.");
      return completeConfig;
    } catch (err: unknown) {
      if (err instanceof InvalidTwitchConfigError) console.log(err.message);
      throw err;
    }
  }
}
