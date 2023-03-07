module.exports = {
  twitch: {
    token_endpoint: "https://id.twitch.tv/oauth2/token",
    username: process.env.BOT_USERNAME,
    client_id: process.env.BOT_CLIENT_ID,
    client_secret: process.env.BOT_CLIENT_SECRET,
    channel: process.env.BOT_CHANNEL,
    authorization_code: process.env.BOT_AUTHORIZATION_TOKEN,
  },
};
