
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('Starting comprehensive agent name sanitization...');

try {
  // Run migration to remove quotation marks from agent names and other fields
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240922_sanitize_agent_names.sql');
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing sanitization command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('Agent name and field sanitization completed successfully!');
  console.log('Removed quotation marks and special characters from:');
  console.log('- Agent names in clients table');
  console.log('- Agent names in ai_agents table');
  console.log('- Agent descriptions in ai_agents table');
  console.log('- Client names in clients table');
  console.log('- JSON settings fields in both tables');
} catch (error) {
  console.error('Error sanitizing agent names and fields:', error.message);
  process.exit(1);
}
