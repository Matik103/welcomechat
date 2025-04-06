
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mgjodiqecnnltsgorife.supabase.co';

// Export other environment variables as needed
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mgjodiqecnnltsgorife.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is';

// RapidAPI configuration
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'pdf-to-text-converter.p.rapidapi.com';

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;

// Validate required environment variables in development
if (!IS_PRODUCTION) {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  // Check for RapidAPI key specifically but don't fail
  if (!RAPIDAPI_KEY) {
    console.warn('VITE_RAPIDAPI_KEY is missing - PDF text extraction will not work');
  }
}
