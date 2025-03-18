
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('Starting AI Agent names fix migration...');

try {
  // Run the migration using our existing migration runner
  const migrationFile = path.join(__dirname, '../supabase/migrations/20240920_fix_agent_names.sql');
  const command = `node scripts/run-migration.js "${migrationFile}"`;
  
  console.log('Executing migration command:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('AI Agent names migration completed successfully!');
} catch (error) {
  console.error('Error running migration:', error.message);
  process.exit(1);
}
