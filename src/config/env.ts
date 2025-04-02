
// Environment variables configuration
export const LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY;
export const LLAMA_EXTRACTION_AGENT_ID = import.meta.env.VITE_LLAMA_EXTRACTION_AGENT_ID || '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';

if (!LLAMA_CLOUD_API_KEY) {
  throw new Error('VITE_LLAMA_CLOUD_API_KEY is required but not set in environment variables');
}

// Validate API key format
if (!LLAMA_CLOUD_API_KEY.startsWith('llx-')) {
  throw new Error('VITE_LLAMA_CLOUD_API_KEY must start with "llx-"');
}
