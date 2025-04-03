
// Environment variables configuration with better error handling
export const LLAMA_CLOUD_API_KEY = Deno.env.get('LLAMA_CLOUD_API_KEY');
export const LLAMA_EXTRACTION_AGENT_ID = Deno.env.get('LLAMA_EXTRACTION_AGENT_ID') || '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';
export const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Log configuration status
console.log("Environment configuration check:");
console.log(`- LLAMA_CLOUD_API_KEY: ${LLAMA_CLOUD_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
console.log(`- OPENAI_API_KEY: ${OPENAI_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
console.log(`- LLAMA_EXTRACTION_AGENT_ID: ${LLAMA_EXTRACTION_AGENT_ID ? 'Configured ✓' : 'Not configured ✗'}`);
