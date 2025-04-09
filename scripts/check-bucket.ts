import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkBucket() {
  console.log('Checking client_documents bucket...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }

    console.log('Found buckets:', buckets.map(b => b.name));
    
    const documentBucket = buckets.find(b => b.name === 'client_documents');
    if (!documentBucket) {
      console.log('client_documents bucket not found, creating...');
      const { data, error: createError } = await supabase.storage.createBucket('client_documents', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['application/pdf', 'text/plain', 'application/vnd.google-apps.document']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log('Successfully created client_documents bucket');
      }
    } else {
      console.log('client_documents bucket exists');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBucket(); 