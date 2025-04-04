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

async function checkClients() {
  try {
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'clients'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.error('Error getting table info:', tableError);
      return;
    }

    console.log('Clients table structure:', tableInfo);

    // Get a sample client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
      .single();

    if (clientError) {
      console.error('Error getting client:', clientError);
      return;
    }

    console.log('Sample client:', clients);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkClients(); 