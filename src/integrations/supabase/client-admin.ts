// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

// Get the URL and service role key from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("VITE_SUPABASE_SERVICE_ROLE_KEY is not configured");
}

// Create the admin client with the service role key
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY || '', 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Export a function to check if the admin client is configured properly
export const isAdminClientConfigured = (): boolean => {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("VITE_SUPABASE_SERVICE_ROLE_KEY is not configured");
    return false;
  }
  return true;
};
