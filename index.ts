import { ConfigValidator } from "./src/validators/configValidator";
import { TwitchChatBot } from "./src/launcher";
import { ChatBotConfig } from "./src/models/config.model";

ConfigValidator.readConfig("./config.json").then((config: ChatBotConfig) =>
  new TwitchChatBot(config).launch()
);
