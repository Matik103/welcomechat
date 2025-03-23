
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
    
    // Execute the SQL directly using Supabase's REST API
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Document processing tables migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
