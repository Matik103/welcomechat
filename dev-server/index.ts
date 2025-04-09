
// Dev server configuration and setup will go here
export const devServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  host: process.env.HOST || 'localhost'
};
