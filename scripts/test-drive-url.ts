import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testDriveUrl() {
  try {
    // Use the test agent ID
    const agentId = '789de12f-d906-4138-baea-49c76cbeefdc';
    
    // Test with a public Google Doc URL (Terms of Service document)
    const url = 'https://docs.google.com/document/d/1ybqAxdRXWAh4KAqQy15tq9bTR5WOgTANAGWkDpZ9mXE/edit?usp=sharing';

    console.log('Processing Google Drive URL:', url);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('process-drive-url', {
      body: {
        url,
        agent_id: agentId
      }
    });

    if (error) {
      console.error('Error processing URL:', error);
      return;
    }

    console.log('Processing successful:', data);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testDriveUrl(); 