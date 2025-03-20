
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running ai_agents table migration...');

try {
  // Path to the migration file
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20240925_add_ai_agents_table.sql');
  
  // Check if the migration file exists
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file not found:', migrationFile);
    process.exit(1);
  }
  
  // Execute the migration using the Supabase CLI
  execSync('npx supabase migration up', { stdio: 'inherit' });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
