// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';

// Supabase configuration - using direct values instead of relying on environment variables
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is";

// Create a singleton instance to avoid multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    console.log("Initializing Supabase client...");
    supabaseInstance = createClient<Database>(
      SUPABASE_URL, 
      SUPABASE_ANON_KEY, 
      {
        auth: {
          persistSession: true,
          storageKey: 'welcomechat_auth_token',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          debug: process.env.NODE_ENV === 'development'
        },
        global: {
          headers: {
            'x-custom-timeout': '15000'  // 15 second timeout
          }
        },
        db: {
          schema: 'public'
        },
        realtime: {
          timeout: 15000  // 15 second timeout for realtime
        }
      }
    );
  }
  return supabaseInstance;
}

// Export the supabase instance
export const supabase = getSupabase();

// Export a function to force refresh the session if needed
export const refreshSupabaseSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
    console.log("Session refreshed successfully");
    return true;
  } catch (e) {
    console.error("Exception refreshing session:", e);
    return false;
  }
};
