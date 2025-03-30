
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded Supabase configuration (no reliance on environment variables)
export const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

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

// Export additional utility functions
export const isAdminClientConfigured = (): boolean => {
  return Boolean(SUPABASE_SERVICE_KEY) && Boolean(SUPABASE_URL);
};

// Initialize a bucket if it doesn't exist
export const initializeBucket = async (bucketName: string, options: {
  public: boolean,
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

// Initialize bot logos bucket
export const initializeBotLogosBucket = (): Promise<boolean> => {
  return initializeBucket('bot-logos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
  });
};
