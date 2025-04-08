
// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the Supabase URL and make sure it's always defined with a fallback
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mgjodiqecnnltsgorife.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is';

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = SUPABASE_URL;

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;

// RapidAPI Configuration
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'pdf-to-text-converter.p.rapidapi.com';
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';

// Loading Fallback configurations
export const DEFAULT_LOADING_TIMEOUT = 10; // seconds
export const AUTH_LOADING_TIMEOUT = 5; // seconds
