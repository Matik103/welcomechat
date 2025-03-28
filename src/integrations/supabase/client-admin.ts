
// This client has the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from 'sonner';

// Get the URL and service role key from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_KEY;

// Fallback key for development only - do not use in production
const FALLBACK_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.qB6EALQwgkR9BQ2_QR_4MmXFQgFrm17D_yODKmnFE7M";

if (!SUPABASE_SERVICE_KEY) {
  console.warn("VITE_SUPABASE_SERVICE_ROLE_KEY is not configured, using fallback key for development. This is not recommended for production.");
}

// Create the admin client with the service role key
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY || FALLBACK_SERVICE_KEY, 
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
  return Boolean(SUPABASE_SERVICE_KEY || FALLBACK_SERVICE_KEY);
};

// Export a function to initialize bucket if it doesn't exist
export const initializeBotLogosBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'bot-logos');
    
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
