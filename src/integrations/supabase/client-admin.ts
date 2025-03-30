
// Determine if we should add the necessary exports or just check the existing file and add the missing exports
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL } from './client';

// Get the service role key from environment
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create a singleton instance for the admin client
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

// Check if the admin client can be configured
export const isAdminClientConfigured = (): boolean => {
  return !!SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY.length > 0;
};

// Initialize the bot-logos bucket
export const initializeBotLogosBucket = async (): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured()) {
      console.error('Cannot initialize buckets: Supabase admin client not configured');
      return false;
    }

    // Create the bucket if it doesn't exist
    const { error } = await supabaseAdmin.storage.createBucket('bot-logos', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bot-logos bucket:', error);
      return false;
    }

    console.log('bot-logos bucket initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing bot-logos bucket:', error);
    return false;
  }
};

// Export the admin client (initialize only if service role key is available)
export const supabaseAdmin = (() => {
  if (isAdminClientConfigured()) {
    if (!supabaseAdminInstance) {
      console.log('Initializing Supabase admin client...');
      supabaseAdminInstance = createClient<Database>(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }
    return supabaseAdminInstance;
  }

  // Return a mock object that logs errors when methods are called
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        // Allow checking for certain properties without triggering the warning
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }

        // For everything else, return a function that warns about missing service role key
        return () => {
          console.error(
            'Supabase admin client not properly configured. Check that VITE_SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.'
          );
          return {
            data: null,
            error: new Error('Supabase admin client not configured'),
          };
        };
      },
    }
  ) as ReturnType<typeof createClient<Database>>;
})();

export default supabaseAdmin;
