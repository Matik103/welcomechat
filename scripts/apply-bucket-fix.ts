import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyBucketFix() {
  try {
    console.log('Applying bucket configuration fixes...');

    // Read the SQL file
    const sqlPath = resolve(__dirname, 'fix-bucket.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error('Error executing SQL:', error);
          console.error('Failed statement:', statement);
        } else {
          console.log('Successfully executed:', statement.split('\n')[0]);
        }
      } catch (error) {
        console.error('Error executing statement:', error);
        console.error('Failed statement:', statement);
      }
    }

    // Verify the bucket configuration
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const documentBucket = buckets?.find(b => b.name === 'Client Documents');
    if (documentBucket) {
      console.log('\nFinal bucket configuration:');
      console.log(JSON.stringify(documentBucket, null, 2));
    } else {
      console.error('Could not find Client Documents bucket after update');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
applyBucketFix().catch(console.error); 