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

async function testUpload() {
  try {
    // Use the test agent ID
    const agentId = '789de12f-d906-4138-baea-49c76cbeefdc';

    // Create test file content
    const fileContent = new Blob(['This is a test document'], { type: 'text/plain' });
    const fileName = 'test.txt';
    const filePath = `${agentId}/documents/${Date.now()}_${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('document-storage')
      .upload(filePath, fileContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('document-storage')
      .getPublicUrl(filePath);

    console.log('File URL:', urlData.publicUrl);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUpload(); 