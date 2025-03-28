
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

// Get the URL and service role key from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Check if we have a valid service role key
const hasValidServiceKey = SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY.length > 20;

// Create the admin client with the service role key (if available)
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY || 'MISSING_SERVICE_KEY', // Fallback to prevent runtime error
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
  return hasValidServiceKey;
};

// Export a function to initialize bucket if it doesn't exist
export const initializeBotLogosBucket = async (): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured()) {
      console.error("Cannot initialize bot-logos bucket: Supabase service role key is missing or invalid");
      return false;
    }
    
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
