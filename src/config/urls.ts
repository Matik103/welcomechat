type AppUrls = {
  base: string;
  clientDashboard: string;
  auth: string;
  adminDashboard: string;
};

type AppUrlConfig = {
  production: AppUrls;
  development: AppUrls;
};

export const APP_URLS: AppUrlConfig = {
  production: {
    base: 'https://welcome.chat',
    adminDashboard: 'https://welcome.chat',
    clientDashboard: 'https://admin.welcome.chat/client/dashboard',
    auth: 'https://welcome.chat/auth'
  },
  development: {
    base: 'http://localhost:8081',
    adminDashboard: 'http://localhost:8081',
    clientDashboard: 'http://localhost:8081/client/dashboard',
    auth: 'http://localhost:8081/auth'
  }
};

export const getAppUrls = () => {
  const isDevelopment = import.meta.env.DEV;
  return isDevelopment ? APP_URLS.development : APP_URLS.production;
};

export const getClientDashboardUrl = () => {
  return getAppUrls().clientDashboard;
};

export const getAdminDashboardUrl = () => {
  return getAppUrls().adminDashboard;
}; 