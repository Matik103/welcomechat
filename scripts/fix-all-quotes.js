
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('Starting comprehensive quote sanitization...');

try {
  // Ensure the migration file exists
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240922_fix_all_quotes.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`Migration file not found: ${migrationFile}`);
    process.exit(1);
  }
  
  // Run the migration using our existing migration runner
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing migration command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('Comprehensive quote sanitization completed successfully!');
  console.log('All double quotes in agent names, descriptions, and related fields have been replaced with single quotes.');
} catch (error) {
  console.error('Error running sanitization:', error.message);
  process.exit(1);
}
