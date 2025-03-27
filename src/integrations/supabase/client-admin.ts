
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use hardcoded values or import from a config file for client-side
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";

// We'll need to use an environment variable that's available at build time
// Vite allows for this with import.meta.env instead of process.env
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Provide better error handling if the key is missing
if (!SUPABASE_SERVICE_KEY) {
  console.error("VITE_SUPABASE_SERVICE_ROLE_KEY is not defined in your environment variables.");
  console.error("Please add it to your .env file or set it as a Supabase secret.");
  console.error("For Lovable.dev, you need to set this in the Supabase secrets section.");
}

// Only import this client for admin operations that require the service role
// This should not be used in client-side code
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY || "MISSING_SERVICE_KEY", // Provide a placeholder to prevent immediate crash
  {
    auth: {
      persistSession: false, // Don't persist session for admin client
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Add a helper function to check if the admin client is properly configured
export const isAdminClientConfigured = () => {
  return !!SUPABASE_SERVICE_KEY;
};
