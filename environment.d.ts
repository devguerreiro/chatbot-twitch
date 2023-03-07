declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_USERNAME: string;
      BOT_CLIENT_ID: string;
      BOT_CLIENT_SECRET: string;
      BOT_CHANNEL: string;
      BOT_AUTHORIZATION_TOKEN: string;
    }
  }
}

export {};
