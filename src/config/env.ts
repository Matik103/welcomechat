
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the environment
export const IS_PRODUCTION = true; // Always true on Lovable.dev
export const NODE_ENV = 'production'; // Always production on Lovable.dev

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = 'https://mgjodiqecnnltsgorife.supabase.co';

// Export hardcoded Supabase configuration
export const SUPABASE_URL = 'https://mgjodiqecnnltsgorife.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is';

// RapidAPI settings
export const RAPIDAPI_KEY = '';
export const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';

// OpenAI settings
export const OPENAI_API_KEY = '';
export const OPENAI_ASSISTANT_ID = '';

// DeepSeek settings
export const DEEPSEEK_API_KEY = '';
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
export const DEEPSEEK_MODEL = 'deepseek-chat';

// Log information about missing configurations in console, but don't throw errors
if (!RAPIDAPI_KEY) {
  console.info('No RAPIDAPI_KEY provided');
}

if (!OPENAI_API_KEY) {
  console.info('No OPENAI_API_KEY provided');
}

if (!OPENAI_ASSISTANT_ID) {
  console.info('No OPENAI_ASSISTANT_ID provided');
}

if (!DEEPSEEK_API_KEY) {
  console.info('No DEEPSEEK_API_KEY provided');
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
  cacheControl: '31536000', // 1 year in production
  cdnEnabled: true,
};

// Create a helper function to check if we're running in production
export const isProduction = () => true; // Always true on Lovable.dev

// Create a helper to validate environment
export const validateEnvironment = () => {
  const issues = [];
  
  if (!SUPABASE_URL) issues.push('Missing Supabase URL');
  if (!SUPABASE_ANON_KEY) issues.push('Missing Supabase Anon Key');
  
  return {
    valid: issues.length === 0,
    issues
  };
};
