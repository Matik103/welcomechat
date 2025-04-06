// Environment variables and configuration

// Cache settings
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CACHE_REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Get the Supabase URL for edge functions
export const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL;

// Export other environment variables as needed
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// RapidAPI configuration
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
export const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST;

// App settings
export const APP_VERSION = '1.0.0';
export const IS_PRODUCTION = import.meta.env.PROD;

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_RAPIDAPI_KEY: string
  VITE_RAPIDAPI_HOST: string
}

const requiredEnvVars = {
  VITE_SUPABASE_URL: {
    value: SUPABASE_URL,
    description: 'Supabase project URL'
  },
  VITE_SUPABASE_ANON_KEY: {
    value: SUPABASE_ANON_KEY,
    description: 'Supabase anonymous key'
  },
  VITE_RAPIDAPI_KEY: {
    value: RAPIDAPI_KEY,
    description: 'RapidAPI key for PDF text extraction'
  },
  VITE_RAPIDAPI_HOST: {
    value: RAPIDAPI_HOST,
    description: 'RapidAPI host for PDF text extraction'
  },
};

// Validate required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, config]) => !config.value)
  .map(([key, config]) => ({ key, description: config.description }));

if (missingVars.length > 0) {
  const error = new Error(
    `Missing required environment variables:\n${missingVars
      .map(({ key, description }) => `- ${key}: ${description}`)
      .join('\n')}`
  );

  if (IS_PRODUCTION) {
    // In production, show a user-friendly error
    console.error('Configuration error: Missing required environment variables');
    console.error('Please check your deployment configuration.');
    throw error;
  } else {
    // In development, show more details
    console.error('Missing required environment variables:');
    missingVars.forEach(({ key, description }) => 
      console.error(`- ${key}: ${description}`)
    );
    console.error('\nPlease add these variables to your .env file:');
    missingVars.forEach(({ key }) => 
      console.error(`${key}=your_${key.toLowerCase()}_here`)
    );
    if (import.meta.env.MODE === 'test') {
      console.warn('Using default values for testing');
    } else {
      throw error;
    }
  }
}

// Export environment check function
export function validateEnvironment(): void {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, config]) => !config.value)
    .map(([key, config]) => ({ key, description: config.description }));

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars
        .map(({ key, description }) => `- ${key}: ${description}`)
        .join('\n')}`
    );
  }
}
