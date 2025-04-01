
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("VITE_SUPABASE_SERVICE_ROLE_KEY is not configured");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  try {
    console.log('Creating bucket bot-logos...');
    const { data, error } = await supabase
      .storage
      .createBucket('bot-logos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      });

    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }

    console.log('Bucket created successfully:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

createBucket();
