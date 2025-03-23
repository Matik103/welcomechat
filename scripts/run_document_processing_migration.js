
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
    
    // Check if exec_sql RPC function exists by running a simple query
    console.log('Checking if exec_sql RPC function exists...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT 'RPC function exists' as result"
      });
      
      if (error) {
        console.error('Error: exec_sql RPC function is not available:', error);
        console.log('Please ensure the exec_sql function is created in your Supabase project');
        process.exit(1);
      }
      
      console.log('exec_sql RPC function is available');
      
      // Execute the SQL migration
      console.log('Executing migration SQL...');
      const { error: migrationError } = await supabase.rpc('exec_sql', { 
        sql_query: sql 
      });
      
      if (migrationError) {
        console.error('Migration failed:', migrationError);
        process.exit(1);
      }
      
      console.log('Document processing tables migration completed successfully!');
      
      // Verify the table was created with a basic query that returns JSON
      console.log('Verifying document_processing table was created...');
      const verifyQuery = `
        SELECT json_build_object('exists', 
          EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'document_processing'
          )
        ) as result
      `;
      
      const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
        sql_query: verifyQuery
      });
      
      if (verifyError) {
        console.error('Error verifying table creation:', verifyError);
      } else if (verifyData && verifyData.length > 0 && verifyData[0].result && verifyData[0].result.exists) {
        console.log('Verified document_processing table was created successfully');
      } else {
        console.warn('Warning: Could not verify document_processing table creation');
        console.log('Verification response:', JSON.stringify(verifyData));
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
