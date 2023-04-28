export default () => ({
  port: parseInt(process.env.SERVER_PORT),
  databaseUrl: process.env.DATABASE_URL,
  rutrackerUrl: process.env.RUTRACKER_URL,
  rutrackerUser: process.env.RUTRACKER_USER,
  rutrackerPassword: process.env.RUTRACKER_PASSWORD,
  maxBrowsersCount: +process.env.MAX_BROWSERS,
});
