
/**
 * Environment variables and configuration
 */
import { getSecrets } from '@/services/secretsService';

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

  // LlamaIndex and OpenAI keys are not strictly required for basic app functionality
  // They will be checked separately for document processing features
  
  return true;
};

// Initialize secrets from Supabase if not available from environment
export const initializeSecrets = async (): Promise<void> => {
  try {
    // Only attempt to fetch secrets if environment variables are not set
    const keysToFetch = [];
    
    if (!LLAMA_CLOUD_API_KEY) {
      keysToFetch.push('LLAMA_CLOUD_API_KEY');
    }
    
    if (!OPENAI_API_KEY) {
      keysToFetch.push('OPENAI_API_KEY');
    }
    
    if (keysToFetch.length === 0) {
      console.log('All keys available from environment variables');
      return;
    }
    
    console.log('Fetching missing keys from Supabase secrets:', keysToFetch);
    const secrets = await getSecrets(keysToFetch);
    
    // Manually update each module variable if fetched from secrets
    // This is not ideal but necessary since we can't modify the imported constant values
    if (!LLAMA_CLOUD_API_KEY && secrets.LLAMA_CLOUD_API_KEY) {
      (window as any).__ENV_LLAMA_CLOUD_API_KEY = secrets.LLAMA_CLOUD_API_KEY;
      console.log('LLAMA_CLOUD_API_KEY fetched from secrets');
    }
    
    if (!OPENAI_API_KEY && secrets.OPENAI_API_KEY) {
      (window as any).__ENV_OPENAI_API_KEY = secrets.OPENAI_API_KEY;
      console.log('OPENAI_API_KEY fetched from secrets');
    }
  } catch (error) {
    console.error('Error initializing secrets:', error);
  }
};

// Function to get the LlamaIndex API key (checking both env var and window global)
export const getLlamaCloudApiKey = (): string => {
  return LLAMA_CLOUD_API_KEY || (window as any).__ENV_LLAMA_CLOUD_API_KEY || '';
};

// Function to get the OpenAI API key (checking both env var and window global)
export const getOpenAiApiKey = (): string => {
  return OPENAI_API_KEY || (window as any).__ENV_OPENAI_API_KEY || '';
};
