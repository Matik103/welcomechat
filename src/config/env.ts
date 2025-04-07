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
export const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';

// Validate required environment variables
if (!RAPIDAPI_KEY) {
  console.warn('Missing required environment variable: VITE_RAPIDAPI_KEY');
}

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;

// PDF Processing Configuration
export const PDF_PROCESSING = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  optimalChunkSize: 10 * 1024 * 1024, // 10MB
  supportedTypes: ['application/pdf'],
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// API Configuration
export const API_CONFIG = {
  endpoints: {
    pdfToText: 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert',
  },
  timeout: 300000, // 5 minutes
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};
