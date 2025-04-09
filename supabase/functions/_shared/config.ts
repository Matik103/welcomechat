
// Shared configuration for edge functions

// Get environment variables with fallbacks
export const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
export const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_4YMVyqm2_Bzysfnt8rzVEjewRp1haXciL';
export const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || 'sk-59ec5a04cb1048bd9247d176dd39426f';

// Validate required API keys
if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
  console.warn("WARNING: Neither OpenAI nor DeepSeek API keys are set. AI functionality may be limited.");
}
