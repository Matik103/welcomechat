
// Script to run the document processing tables migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running document processing tables migration...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '../supabase/migrations/20240918_document_processing_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // First check if exec_sql RPC function exists
    try {
      const { data: rpcExists, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT 'RPC function exists' as result"
      });
      
      if (rpcError) {
        console.error('Error: exec_sql RPC function is not available:', rpcError);
        console.log('Please ensure the exec_sql function is created in your Supabase project');
        process.exit(1);
      }
      
      // Execute the SQL directly using Supabase's RPC function
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
      }
      
      console.log('Document processing tables migration completed successfully!');
      
      // Verify the table was created
      const { data, verifyError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'document_processing'
          ) as exists
        `
      });
      
      if (verifyError) {
        console.error('Error verifying table creation:', verifyError);
      } else if (data && data[0] && data[0].exists) {
        console.log('Verified document_processing table was created successfully');
      } else {
        console.warn('Warning: Could not verify document_processing table creation');
      }
      
    } catch (rpcCheckError) {
      console.error('Error checking for RPC function:', rpcCheckError);
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
