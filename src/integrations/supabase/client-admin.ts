
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcode the URL since we know it
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";

// Get the service role key from environment variables
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create the admin client with the service role key
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // Don't persist session for admin client
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
