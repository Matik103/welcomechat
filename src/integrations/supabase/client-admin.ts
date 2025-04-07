
// Determine if we should add the necessary exports or just check the existing file and add the missing exports
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL } from './client';

// Use hardcoded service role key
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

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
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
      fileSizeLimit: 1024 * 1024 * 2 // 2MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bot-logos bucket:', error);
      return false;
    }
    
    // Also create client_documents bucket
    const { error: docError } = await supabaseAdmin.storage.createBucket('client_documents', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'text/plain',
        'application/vnd.google-apps.document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 1024 * 1024 * 20 // 20MB
    });

    if (docError && !docError.message.includes('already exists')) {
      console.error('Error creating client_documents bucket:', docError);
      // Continue anyway, since we at least created the bot-logos bucket
    }

    console.log('Storage buckets initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return false;
  }
};

// Export the admin client (always initialize with hardcoded key)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    console.log('Initializing Supabase admin client');
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
})();

export default supabaseAdmin;

/**
 * Initialize storage buckets
 */
export const initializeStorage = async () => {
  try {
    // Create bot logos bucket if it doesn't exist
    const { error } = await supabaseAdmin.storage.createBucket('bot-logos', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
      fileSizeLimit: 1024 * 1024 * 2 // 2MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bot logos bucket:', error);
    }

    // Create document storage bucket if it doesn't exist
    const { error: docError } = await supabaseAdmin.storage.createBucket('client_documents', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'text/plain',
        'application/vnd.google-apps.document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 1024 * 1024 * 20 // 20MB
    });

    if (docError && !docError.message.includes('already exists')) {
      console.error('Error creating client documents bucket:', docError);
    }

    console.log('Storage buckets initialized');
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
