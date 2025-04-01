
// Utility functions used by FirecrawlService
export const getApiKeyFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('firecrawl_api_key');
  }
  return null;
};

export const getApiKeyFromEnv = (): string | null => {
  if (typeof window !== 'undefined' && window.ENV?.VITE_FIRECRAWL_API_KEY) {
    return window.ENV.VITE_FIRECRAWL_API_KEY;
  }
  return null;
};

export const getBaseUrlFromEnv = (): string => {
  if (typeof window !== 'undefined' && window.ENV?.VITE_FIRECRAWL_API_URL) {
    return window.ENV.VITE_FIRECRAWL_API_URL;
  }
  return 'https://api.firecrawl.dev/v1';
};

export const getEffectiveApiKey = (): string | null => {
  return getApiKeyFromEnv() || getApiKeyFromStorage();
};
