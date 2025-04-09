
// Environment variables configuration
export const LLAMA_CLOUD_API_KEY = Deno.env.get('LLAMA_CLOUD_API_KEY') || 'llx-Qy4NvsmC9BhtGwMtthOL5QNKhxmj0diiokWvAEkPJi4RxF8Z';
export const LLAMA_EXTRACTION_AGENT_ID = Deno.env.get('LLAMA_EXTRACTION_AGENT_ID') || '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';
export const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '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';

// Note: We no longer throw errors if API keys are missing from environment
// as we'll try to fetch them from Supabase first
console.log("Initialized environment configuration");
