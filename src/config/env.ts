// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';

// Export other environment variables as needed
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// RapidAPI settings
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'pdf-to-text-converter.p.rapidapi.com';

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;

// PDF processing settings
export const PDF_EXTRACTION_ENABLED = true;
export const PDF_EXTRACTION_MAX_SIZE = 20 * 1024 * 1024; // 20MB

// API Configuration
export const API_CONFIG = {
  baseURL: EDGE_FUNCTIONS_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Deepseek Configuration
export const DEEPSEEK_MODEL = 'deepseek-chat';

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_RAPIDAPI_KEY',
  ];

  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};
