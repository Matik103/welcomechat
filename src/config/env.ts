
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the environment
export const IS_PRODUCTION = import.meta.env.PROD;
export const NODE_ENV = import.meta.env.MODE || 'development';

// Get the Supabase URL and keys with production-ready fallbacks
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mgjodiqecnnltsgorife.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is';

// Edge functions URL (same as Supabase URL)
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || SUPABASE_URL;

// RapidAPI settings with hardcoded fallback
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d';
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'pdf-to-text-converter.p.rapidapi.com';

// OpenAI API key with updated value
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';

// Validate required environment variables in development only
if (!IS_PRODUCTION && !RAPIDAPI_KEY) {
  console.warn('Missing required environment variable: VITE_RAPIDAPI_KEY');
}

// App settings
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// PDF Processing Configuration
export const PDF_PROCESSING = {
  maxFileSize: 250 * 1024 * 1024, // 250MB (increased from 100MB)
  optimalChunkSize: 20 * 1024 * 1024, // 20MB (increased from 10MB)
  supportedTypes: ['application/pdf'],
  maxRetries: IS_PRODUCTION ? 5 : 3, // More retries in production
  retryDelay: 1000, // 1 second
};

// API Configuration
export const API_CONFIG = {
  endpoints: {
    pdfToText: 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert',
  },
  timeout: IS_PRODUCTION ? 900000 : 600000, // 15 minutes in production (increased from 10), 10 minutes in development (increased from 5)
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

// CDN and caching configuration for production
export const STORAGE_CONFIG = {
  cacheControl: IS_PRODUCTION ? '31536000' : '3600', // 1 year in production, 1 hour in development
  cdnEnabled: IS_PRODUCTION,
};

// Create a helper function to check if we're running in production
export const isProduction = () => IS_PRODUCTION;

// Create a helper to validate environment
export const validateEnvironment = () => {
  const issues = [];
  
  if (!SUPABASE_URL) issues.push('Missing Supabase URL');
  if (!SUPABASE_ANON_KEY) issues.push('Missing Supabase Anon Key');
  if (!RAPIDAPI_KEY) issues.push('Missing RapidAPI Key');
  if (!OPENAI_API_KEY) issues.push('Missing OpenAI API Key'); // Added OpenAI API key check
  
  return {
    valid: issues.length === 0,
    issues
  };
};
