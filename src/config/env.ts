
/**
 * Environment variables configuration
 * These are loaded from .env file during build time
 * or from Supabase secrets at runtime
 */

// API Keys
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
export const LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY as string;

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Application Configuration
export const APP_URL = import.meta.env.VITE_APP_URL as string;

// Cache for values fetched from secrets
let secretsCache: Record<string, string> = {};

/**
 * Get environment variable with fallback to secrets
 * @param key Environment variable key
 * @param defaultValue Default value if not found
 * @returns The value of the environment variable or default
 */
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // First check if it exists in env
  const envValue = import.meta.env[`VITE_${key}`];
  if (envValue) return envValue as string;
  
  // Then check if we have it in secrets cache
  if (secretsCache[key]) return secretsCache[key];
  
  // Return default if not found
  return defaultValue;
};

/**
 * Set secrets cache - used by secretsService
 * @param secrets Object with key-value pairs
 */
export const setSecretsCache = (secrets: Record<string, string>): void => {
  secretsCache = { ...secretsCache, ...secrets };
};

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

  // Check OpenAI API key - warning only if not through secrets
  if (!OPENAI_API_KEY && !secretsCache['OPENAI_API_KEY']) {
    console.warn('OpenAI API key is not set in environment. Will attempt to fetch from Supabase secrets.');
  }

  // Check LlamaIndex API key - warning only if not through secrets
  if (!LLAMA_CLOUD_API_KEY && !secretsCache['LLAMA_CLOUD_API_KEY']) {
    console.warn('LlamaIndex Cloud API key is not set in environment. Will attempt to fetch from Supabase secrets.');
  }

  // Check application URL
  if (!APP_URL) {
    console.error('Application URL is not set. Please check your environment variables.');
    isValid = false;
  }

  return isValid;
}
