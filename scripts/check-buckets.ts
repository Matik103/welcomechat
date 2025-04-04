
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBuckets() {
  try {
    console.log('Checking available buckets...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (ID: ${bucket.id}, Public: ${bucket.public})`);
    });
    
    // Look for client_documents bucket
    const documentBucket = buckets.find(b => b.name === 'client_documents');
    if (documentBucket) {
      console.log('\nFound client_documents bucket:');
      console.log(documentBucket);
      
      // List files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('client_documents')
        .list();
        
      if (filesError) {
        console.error('Error listing files:', filesError);
      } else {
        console.log('\nFiles in client_documents bucket:');
        if (files.length === 0) {
          console.log('No files found');
        } else {
          files.forEach(file => {
            console.log(`- ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
          });
        }
      }
    } else {
      console.log('\nWARNING: client_documents bucket not found!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBuckets();
