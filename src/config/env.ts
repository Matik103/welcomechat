/**
 * Environment variables and configuration
 */

// URL for the Supabase instance
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Supabase anon key for public API access
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// LlamaIndex API key - can come from env var for local dev or from secrets in production
export const LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY as string;

// OpenAI API key - required for LlamaIndex document processing
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

// Base URL for Edge Functions
export const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Document processing options
export const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Check if required environment variables are set
export const checkRequiredEnvVars = (): boolean => {
  if (!SUPABASE_URL) {
    console.error('VITE_SUPABASE_URL is not set');
    return false;
  }
  
  if (!SUPABASE_ANON_KEY) {
    console.error('VITE_SUPABASE_ANON_KEY is not set');
    return false;
  }

  // Optional check for LlamaIndex functionality
  if (!LLAMA_CLOUD_API_KEY) {
    console.warn('VITE_LLAMA_CLOUD_API_KEY is not set - LlamaIndex functionality will be limited');
  }

  if (!OPENAI_API_KEY) {
    console.warn('VITE_OPENAI_API_KEY is not set - LlamaIndex document processing will be limited');
  }
  
  return true;
};
