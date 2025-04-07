// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the environment
export const IS_PRODUCTION = import.meta.env.PROD;
export const NODE_ENV = import.meta.env.MODE || 'development';

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';

// Export other environment variables as needed
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// RapidAPI settings
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
export const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';

// OpenAI settings
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const OPENAI_ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID || '';

// DeepSeek settings
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
export const DEEPSEEK_MODEL = 'deepseek-chat';

// Validate required environment variables
if (!RAPIDAPI_KEY) {
  console.warn('Missing required environment variable: VITE_RAPIDAPI_KEY');
}

if (!OPENAI_API_KEY) {
  console.warn('Missing required environment variable: VITE_OPENAI_API_KEY');
}

if (!OPENAI_ASSISTANT_ID) {
  console.warn('Missing required environment variable: VITE_OPENAI_ASSISTANT_ID');
}

if (!DEEPSEEK_API_KEY) {
  console.warn('Missing required environment variable: VITE_DEEPSEEK_API_KEY');
}

// App settings
export const APP_VERSION = '1.0.0';

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
    deepseek: DEEPSEEK_API_URL,
  },
  timeout: 300000, // 5 minutes
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
  if (!OPENAI_API_KEY) issues.push('Missing OpenAI API Key');
  if (!OPENAI_ASSISTANT_ID) issues.push('Missing OpenAI Assistant ID');
  if (!DEEPSEEK_API_KEY) issues.push('Missing DeepSeek API Key');
  
  return {
    valid: issues.length === 0,
    issues
  };
};
