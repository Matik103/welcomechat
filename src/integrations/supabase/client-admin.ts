
import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase/types';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';

// Define the service role key - using the value from import.meta.env
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Service role client
const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('Initialized supabaseAdmin client with URL:', SUPABASE_URL);

// Add utility functions that were being imported elsewhere
export const isAdminClientConfigured = () => {
  return !!SUPABASE_SERVICE_ROLE_KEY;
};

export const initializeBotLogosBucket = async () => {
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket('bot_logos');
    if (error && error.message.includes('not found')) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseAdmin.storage.createBucket('bot_logos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      });
      
      if (createError) {
        console.error('Error creating bot_logos bucket:', createError);
        return false;
      }
      console.log('Created bot_logos bucket');
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error initializing bot_logos bucket:', error);
    return false;
  }
};

// Function to initialize all required storage buckets
export const initializeStorage = async () => {
  const botLogosInitialized = await initializeBotLogosBucket();
  return {
    botLogos: botLogosInitialized
  };
};

export { supabaseAdmin };
export default supabaseAdmin;
