
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('Starting agent name removal migration...');

try {
  // Ensure the migration file exists
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240923_default_agent_names.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`Migration file not found: ${migrationFile}`);
    process.exit(1);
  }
  
  // Run the migration using our existing migration runner
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing migration command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('Agent name removal migration completed successfully!');
  console.log('All agent names have been standardized and the field has been removed from the UI.');
} catch (error) {
  console.error('Error running migration:', error.message);
  process.exit(1);
}
