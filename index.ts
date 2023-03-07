import { ConfigValidator } from "./src/validators/configValidator";
import { TwitchChatBot } from "./src/launcher";
import { ChatBotConfig } from "./src/models/config.model";

import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

ConfigValidator.readConfig().then((config: ChatBotConfig) =>
  new TwitchChatBot(config).launch()
);
