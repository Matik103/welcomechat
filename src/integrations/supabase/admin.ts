
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

// Supabase configuration - using direct values instead of relying on environment variables
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

// Export a function to check if the admin client is configured properly
export const isAdminClientConfigured = (): boolean => {
  try {
    // If the key is missing or empty, return false
    if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.trim() === '') {
      console.error('Supabase service role key is missing or empty');
      return false;
    }
    
    // Check if the key has the correct structure (length and format)
    if (!SUPABASE_SERVICE_KEY.includes('eyJ') || SUPABASE_SERVICE_KEY.length < 100) {
      console.error('Supabase service role key appears to be invalid');
      return false;
    }
    
    // If everything checks out, return true
    return true;
  } catch (error) {
    console.error('Error checking admin client configuration:', error);
    return false;
  }
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
      
      // If we get an invalid signature error, it means the service role key is invalid
      if (listError.message?.includes('invalid signature')) {
        toast.error('Authentication error: Invalid Supabase service role key');
        return false;
      }
      
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
