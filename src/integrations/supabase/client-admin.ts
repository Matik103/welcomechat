
// Determine if we should add the necessary exports or just check the existing file and add the missing exports
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL } from './client';

// Get the service role key from environment
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

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
    
    // Also create document-storage bucket
    const { error: docError } = await supabaseAdmin.storage.createBucket('document-storage', {
      public: true,
      fileSizeLimit: 20971520, // 20MB
    });

    if (docError && !docError.message.includes('already exists')) {
      console.error('Error creating document-storage bucket:', docError);
      // Continue anyway, since we at least created the bot-logos bucket
    }

    console.log('Storage buckets initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return false;
  }
};

// Export the admin client (initialize only if service role key is available)
export const supabaseAdmin = (() => {
  if (isAdminClientConfigured()) {
    if (!supabaseAdminInstance) {
      console.log('Initializing Supabase admin client with service role key:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
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
