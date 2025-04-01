
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL from the client-side config
import { SUPABASE_URL } from './client';

// Safe access to environment variables
const getEnvVariable = (name: string): string => {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  
  // Browser environment with import.meta
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name] as string;
  }
  
  return '';
};

// Use getEnvVariable for safer access
const SUPABASE_SERVICE_ROLE_KEY = getEnvVariable('VITE_SUPABASE_SERVICE_ROLE_KEY');

// Create a Supabase client with the service role key
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Helper function to check if the admin client is configured
export const isAdminClientConfigured = () => {
  return !!SUPABASE_SERVICE_ROLE_KEY && !!supabaseAdmin;
};

// Function to initialize the bot logos bucket
export const initializeBotLogosBucket = async () => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured');
    return false;
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .createBucket('bot-logos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      });
      
    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
    
    console.log('Bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error creating bucket:', error);
    return false;
  }
};
