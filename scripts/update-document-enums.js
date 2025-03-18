
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

// Function to run the document processing migration
function runDocumentMigration() {
  try {
    console.log('Running document processing migration...');
    
    // Get the path to the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240917_document_processing.sql');
    
    // Run the migration using the run-migration.js script
    execSync(`node ${path.join(__dirname, 'run-migration.js')} ${migrationPath}`, {
      stdio: 'inherit'
    });
    
    console.log('Document processing migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runDocumentMigration();
