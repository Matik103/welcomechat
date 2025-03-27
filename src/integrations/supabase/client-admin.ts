
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcode the URL since we know it
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";

// Get the service role key from environment variables
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create a fallback key for development (not recommended for production)
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is";

// If service key is not available, log a warning and use the fallback key
if (!SUPABASE_SERVICE_KEY) {
  console.warn("VITE_SUPABASE_SERVICE_ROLE_KEY is not set. Using fallback key for development only.");
}

// Create the admin client with the service role key or fallback
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY || FALLBACK_KEY, 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);
