
// Environment configuration with defaults
const env = {
  // API base URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  
  // Auth configuration
  AUTH_REQUIRED: import.meta.env.VITE_AUTH_REQUIRED !== 'false',
  
  // Feature flags
  FEATURES: {
    CHAT_ENABLED: import.meta.env.VITE_FEATURE_CHAT_ENABLED !== 'false',
    ANALYTICS_ENABLED: import.meta.env.VITE_FEATURE_ANALYTICS_ENABLED !== 'false',
    DOCUMENT_UPLOAD_ENABLED: import.meta.env.VITE_FEATURE_DOCUMENT_UPLOAD_ENABLED !== 'false',
  },
};

// OpenAI configuration
export const OPENAI_CONFIG = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  organization: import.meta.env.VITE_OPENAI_ORGANIZATION || '',
  defaultModel: import.meta.env.VITE_OPENAI_DEFAULT_MODEL || 'gpt-4-turbo-preview',
  temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '4000', 10),
};

// DeepSeek configuration
export const DEEPSEEK_CONFIG = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  defaultModel: import.meta.env.VITE_DEEPSEEK_DEFAULT_MODEL || 'deepseek-chat',
  temperature: parseFloat(import.meta.env.VITE_DEEPSEEK_TEMPERATURE || '0.7'),
  maxTokens: parseInt(import.meta.env.VITE_DEEPSEEK_MAX_TOKENS || '4000', 10),
  enabled: import.meta.env.VITE_DEEPSEEK_ENABLED === 'true',
};

// PDF processing config
export const PDF_PROCESSING = {
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760', 10), // Default 10MB
  maxPages: parseInt(import.meta.env.VITE_MAX_PDF_PAGES || '200', 10),
  chunkSize: parseInt(import.meta.env.VITE_PDF_CHUNK_SIZE || '1000', 10),
  overlap: parseInt(import.meta.env.VITE_PDF_CHUNK_OVERLAP || '100', 10),
  maxRetries: parseInt(import.meta.env.VITE_PDF_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(import.meta.env.VITE_PDF_RETRY_DELAY || '2000', 10),
};

// API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  retries: parseInt(import.meta.env.VITE_API_RETRIES || '3', 10),
};

// RapidAPI configuration
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'pdf-to-text-converter.p.rapidapi.com';

// Export commonly used environment variables
export const DEEPSEEK_MODEL = DEEPSEEK_CONFIG.defaultModel;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const IS_PRODUCTION = import.meta.env.VITE_NODE_ENV === 'production';
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_EDGE_FUNCTIONS_URL || '';
export const CACHE_STALE_TIME = parseInt(import.meta.env.VITE_CACHE_STALE_TIME || '300000', 10); // 5 minutes default

export const validateEnvironment = () => {
  // Implement environment validation if needed
  return true;
};

export default env;
