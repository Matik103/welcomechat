
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Helper function to safely get environment variables
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV && (window as any).__ENV[key]) {
    return (window as any).__ENV[key];
  }
  // Use the proper Vite syntax for environment variables that works with lovable.dev
  const envValue = typeof window !== 'undefined' ? (window as any).__ENV?.[key] : undefined;
  return envValue || fallback;
};

// Get the Supabase URL and make sure it's always defined with a fallback
export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://mgjodiqecnnltsgorife.supabase.co');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is');

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = SUPABASE_URL;

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = getEnvVar('PROD', 'false') === 'true';

// RapidAPI Configuration - Use empty strings as default values
export const RAPIDAPI_CONFIG = {
  HOST: getEnvVar('VITE_RAPIDAPI_HOST', 'pdf-to-text-converter.p.rapidapi.com'),
  KEY: getEnvVar('VITE_RAPIDAPI_KEY', '')
} as const;

// Export individual values for backward compatibility
export const RAPIDAPI_HOST = RAPIDAPI_CONFIG.HOST;
export const RAPIDAPI_KEY = RAPIDAPI_CONFIG.KEY || '';

// Loading Fallback configurations
export const DEFAULT_LOADING_TIMEOUT = 10; // seconds
export const AUTH_LOADING_TIMEOUT = 5; // seconds

// Ensure environment variables are available
if (typeof window !== 'undefined' && !window.hasOwnProperty('__ENV')) {
  (window as any).__ENV = {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    VITE_RAPIDAPI_HOST: RAPIDAPI_HOST,
    VITE_RAPIDAPI_KEY: RAPIDAPI_KEY || '',
    PROD: IS_PRODUCTION.toString()
  };
}
