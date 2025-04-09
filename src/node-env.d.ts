
/// <reference types="node" />

// Define process.env types for TypeScript
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    VITE_SUPABASE_URL?: string
    VITE_SUPABASE_ANON_KEY?: string
    RAPIDAPI_KEY?: string
    [key: string]: string | undefined
  }
}
