
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL from the client-side config
import { SUPABASE_URL } from './client';

// Use process.env for server-side code or import.meta.env for client-side
const SUPABASE_SERVICE_ROLE_KEY = typeof process !== 'undefined' && process.env 
  ? process.env.SUPABASE_SERVICE_ROLE_KEY 
  : import.meta?.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase client with the service role key
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Helper function to check if the admin client is configured
export const isAdminClientConfigured = () => {
  return !!SUPABASE_SERVICE_ROLE_KEY && !!supabaseAdmin;
};
