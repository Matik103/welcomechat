
// Environment variables configuration
export const LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY || 'llx-Qy4NvsmC9BhtGwMtthOL5QNKhxmj0diiokWvAEkPJi4RxF8Z';
export const LLAMA_EXTRACTION_AGENT_ID = import.meta.env.VITE_LLAMA_EXTRACTION_AGENT_ID || '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';

// Note: We no longer throw errors if API keys are missing from environment
// as we'll try to fetch them from Supabase first
console.log("Initialized environment configuration");

// Log whether we have a LLAMA_CLOUD_API_KEY from environment
if (LLAMA_CLOUD_API_KEY) {
  console.log("LLAMA_CLOUD_API_KEY is set");
  
  // Validate API key format
  if (!LLAMA_CLOUD_API_KEY.startsWith('llx-')) {
    console.warn('LLAMA_CLOUD_API_KEY must start with "llx-"');
  }
} else {
  console.log("LLAMA_CLOUD_API_KEY is not set in environment, will attempt to fetch from Supabase");
}

// Log whether we have an OPENAI_API_KEY from environment
if (OPENAI_API_KEY) {
  console.log("OPENAI_API_KEY is set");
} else {
  console.log("OPENAI_API_KEY is not set in environment, will attempt to fetch from Supabase");
}
