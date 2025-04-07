
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
  readonly VITE_RAPIDAPI_KEY: string
  readonly VITE_RAPIDAPI_HOST: string
  readonly VITE_RESEND_API_KEY?: string
  readonly VITE_LLAMA_CLOUD_API_KEY?: string
  readonly VITE_LLAMA_EXTRACTION_AGENT_ID?: string
  readonly VITE_OPENAI_API_KEY?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: {
    accept: Function
    dispose: Function
    data: any
  }
}
