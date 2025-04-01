
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL from the client-side config
import { SUPABASE_URL } from './client';
import { getEnvVariable } from '@/utils/envUtils';

// Safe access to environment variables
const getEnvVariable2 = (name: string): string => {
  // Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  
  // Browser environment with import.meta
  // Access import.meta conditionally to avoid errors in environments that don't support it
  try {
    // @ts-ignore - We're intentionally using dynamic access here to avoid static analysis errors
    if (typeof window !== 'undefined' && window.importMeta && window.importMeta.env && window.importMeta.env[name]) {
      // @ts-ignore
      return window.importMeta.env[name] as string;
    }
  } catch (e) {
    console.warn(`Error accessing import.meta.env.${name}:`, e);
  }
  
  return '';
};

// Use getEnvVariable for safer access
const SUPABASE_SERVICE_ROLE_KEY = getEnvVariable2('VITE_SUPABASE_SERVICE_ROLE_KEY');

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
      // Skip the error if the bucket already exists
      if (error.message && error.message.includes('already exists')) {
        console.log('Bucket bot-logos already exists');
        return true;
      }
      
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
