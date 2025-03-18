
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('Starting AI Agent name verification...');

try {
  // Verify agent names are consistent between clients table and ai_agents table
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240921_verify_agent_names.sql');
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing verification command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('AI Agent names verification completed successfully!');
} catch (error) {
  console.error('Error verifying agent names:', error.message);
  process.exit(1);
}
