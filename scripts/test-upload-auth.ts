
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
  try {
    // Sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test1743748343524@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.error('Error signing in:', authError);
      return;
    }

    console.log('Signed in as:', authData.user);

    // Get user's AI agent
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('email', authData.user.email)
      .single();

    if (agentError) {
      console.error('Error getting agent:', agentError);
      return;
    }

    console.log('Using agent:', agent);

    // List available buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    console.log('Available buckets:', buckets.map(b => b.name));

    const BUCKET_NAME = 'client_documents';

    // Create test file content
    const fileContent = new Blob(['This is a test document'], { type: 'text/plain' });
    const fileName = 'test.txt';
    const filePath = `${agent.id}/documents/${Date.now()}_${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
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
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('File URL:', urlData.publicUrl);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUpload();
