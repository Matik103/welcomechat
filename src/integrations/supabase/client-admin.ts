
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Only import this client for admin operations that require the service role
// This should not be used in client-side code
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // Don't persist session for admin client
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
