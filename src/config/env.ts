
// Environment variables configuration
export const env = {
  // API URLs
  LLAMA_INDEX_API_URL: import.meta.env.VITE_LLAMA_INDEX_API_URL || 'http://localhost:8000',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // API Keys
  LLAMA_CLOUD_API_KEY: import.meta.env.VITE_LLAMA_CLOUD_API_KEY || 'llx-Qy4NvsmC9BhtGwMtthOL5QNKhxmj0diiokWvAEkPJi4RxF8Z',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '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',
  
  // Feature flags
  ENABLE_AI_PROCESSING: import.meta.env.VITE_ENABLE_AI_PROCESSING === 'true',
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // Application settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Document Processing App',
  MAX_UPLOAD_SIZE_MB: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 20),
  
  // Helper methods for environment checks
  isDevelopment: () => import.meta.env.DEV === true,
  isProduction: () => import.meta.env.PROD === true
};

// Export individual variables for backward compatibility
export const LLAMA_CLOUD_API_KEY = env.LLAMA_CLOUD_API_KEY;
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
