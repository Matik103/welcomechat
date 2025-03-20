
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('Starting agent name sanitization...');

try {
  // Run migration to remove quotation marks from agent names
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240922_sanitize_agent_names.sql');
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing sanitization command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('Agent name sanitization completed successfully!');
} catch (error) {
  console.error('Error sanitizing agent names:', error.message);
  process.exit(1);
}
