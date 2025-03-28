
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

// Hardcode the URL since we know it
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";

// Get the service role key from environment variables
// In production, this should be stored in Supabase secrets
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.qB6EALQwgkR9BQ2_QR_4MmXFQgFrm17D_yODKmnFE7M";

// Create the admin client with the service role key
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY, 
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
  return !!SUPABASE_SERVICE_KEY;
};

