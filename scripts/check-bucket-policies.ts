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

async function checkBucketPolicies() {
  console.log('Checking storage bucket policies...');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
      return;
    }

    // Check each bucket's details
    for (const bucket of buckets) {
      console.log(`\nBucket: ${bucket.name}`);
      console.log('ID:', bucket.id);
      console.log('Created at:', bucket.created_at);
      console.log('Updated at:', bucket.updated_at);
      console.log('Public:', bucket.public);
      console.log('File size limit:', bucket.file_size_limit);
      console.log('Allowed mime types:', bucket.allowed_mime_types);
      
      // Try to list files to test access
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list();
      
      if (filesError) {
        console.error(`Error listing files in ${bucket.name}:`, filesError.message);
      } else {
        console.log('Files:', files.length > 0 ? files.map(f => f.name) : 'No files');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBucketPolicies(); 