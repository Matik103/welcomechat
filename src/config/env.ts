
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';

// Export other environment variables as needed
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;
