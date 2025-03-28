
// This client has the service role key for admin operations
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
  return true; // We now have the key directly in the code
};

// Export a function to initialize bucket if it doesn't exist
export const initializeBotLogosBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      
      // If we get an invalid signature error, it means the service role key is invalid
      if (listError.message?.includes('invalid signature')) {
        toast.error('Authentication error: Invalid Supabase service role key');
      }
      
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'bot-logos');
    
    if (!bucketExists) {
      console.log('Creating bot-logos bucket...');
      const { error: createError } = await supabaseAdmin.storage.createBucket('bot-logos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        return false;
      }
      
      console.log('Bot-logos bucket created successfully');
    } else {
      console.log('Bot-logos bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing bucket:", error);
    return false;
  }
};
