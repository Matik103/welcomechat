
/**
 * Environment variables configuration
 * These are loaded from .env file during build time
 */

// API Keys
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
export const LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY as string;

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Application Configuration
export const APP_URL = import.meta.env.VITE_APP_URL as string;

/**
 * Checks if all required environment variables are set
 * @returns boolean indicating if all required variables are set
 */
export function checkRequiredEnvVars(): boolean {
  let isValid = true;

  // Check Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing required Supabase configuration. Please check your environment variables.');
    isValid = false;
  }

  // Check OpenAI API key
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key is not set. Some LlamaIndex document processing features may be limited.');
  }

  // Check LlamaIndex API key
  if (!LLAMA_CLOUD_API_KEY) {
    console.warn('LlamaIndex Cloud API key is not set. Document processing features will be disabled.');
  }

  // Check application URL
  if (!APP_URL) {
    console.error('Application URL is not set. Please check your environment variables.');
    isValid = false;
  }

  return isValid;
}
