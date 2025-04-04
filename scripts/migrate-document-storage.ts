
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

async function migrateDocumentStorage() {
  console.log('Starting document storage migration...');
  
  try {
    // List files in old bucket
    const { data: oldFiles, error: oldFilesError } = await supabase.storage
      .from('Document Storage')
      .list();
    
    if (oldFilesError) {
      console.error('Error listing files in old bucket:', oldFilesError.message);
      return;
    }

    console.log('Files in old bucket:', oldFiles?.length || 0);

    // If there are files, migrate them
    if (oldFiles && oldFiles.length > 0) {
      console.log('Migrating files...');
      
      for (const file of oldFiles) {
        console.log(`Migrating ${file.name}...`);
        
        // Download file from old bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('Document Storage')
          .download(file.name);
        
        if (downloadError) {
          console.error(`Error downloading ${file.name}:`, downloadError.message);
          continue;
        }

        // Upload to new bucket
        const { error: uploadError } = await supabase.storage
          .from('client_documents')
          .upload(file.name, fileData);
        
        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError.message);
          continue;
        }

        // Delete from old bucket
        const { error: deleteError } = await supabase.storage
          .from('Document Storage')
          .remove([file.name]);
        
        if (deleteError) {
          console.error(`Error deleting ${file.name} from old bucket:`, deleteError.message);
        }
      }
    }

    // Delete old bucket
    console.log('Deleting old bucket...');
    const { error: deleteBucketError } = await supabase.storage.deleteBucket('Document Storage');
    
    if (deleteBucketError) {
      console.error('Error deleting old bucket:', deleteBucketError.message);
    } else {
      console.log('Successfully deleted old bucket');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

migrateDocumentStorage();
