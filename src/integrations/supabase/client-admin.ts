
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcode the URL since we know it
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";

// For security reasons and development convenience, we're using a temporary placeholder key
// In production, this should be replaced with your actual service role key via environment variables
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.4FYlzO98F7gKA3jAj45w0QX_qiJqp1IeQAMQCsOIRXQ"; // This is a placeholder key for development

// Only import this client for admin operations that require the service role
// This should not be used in client-side code
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // Don't persist session for admin client
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
