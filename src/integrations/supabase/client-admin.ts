
// Admin client for Supabase functions
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL } from '@/config/env';

const supabaseUrl = SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4';

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// Export utility functions for client admin operations
export const isAdminClientConfigured = (): boolean => {
  return !!supabaseServiceKey && !!supabaseUrl;
};

// Initialize a bucket if it doesn't exist
export const initializeBucket = async (bucketName: string, options: {
  public: boolean, // Changed from optional to required
  allowedMimeTypes?: string[],
  fileSizeLimit?: string | number
}): Promise<boolean> => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating ${bucketName} bucket...`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, options);
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`${bucketName} bucket created successfully`);
    } else {
      console.log(`${bucketName} bucket already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error initializing bucket ${bucketName}:`, error);
    return false;
  }
};

// For backward compatibility, export the bot logos bucket initialization function
export const initializeBotLogosBucket = (): Promise<boolean> => {
  return initializeBucket('bot-logos', {
    public: true, // This is now properly required
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
  });
};

// Initialize storage by setting up all required buckets
export const initializeStorage = async (): Promise<boolean> => {
  try {
    // Initialize bot-logos bucket
    const botLogosInitialized = await initializeBotLogosBucket();
    if (!botLogosInitialized) {
      console.warn('Failed to initialize bot-logos bucket');
    }
    
    // Initialize other buckets as needed
    const documentsInitialized = await initializeBucket('documents', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: '10MB'
    });
    
    if (!documentsInitialized) {
      console.warn('Failed to initialize documents bucket');
    }
    
    return botLogosInitialized && documentsInitialized;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
