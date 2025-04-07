
// Environment variables configuration
export const LLAMA_CLOUD_API_KEY = Deno.env.get('LLAMA_CLOUD_API_KEY') || 'llx-Qy4NvsmC9BhtGwMtthOL5QNKhxmj0diiokWvAEkPJi4RxF8Z';
export const LLAMA_EXTRACTION_AGENT_ID = Deno.env.get('LLAMA_EXTRACTION_AGENT_ID') || '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';
export const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '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';

// Note: We no longer throw errors if API keys are missing from environment
// as we'll try to fetch them from Supabase first
console.log("Initialized environment configuration");
