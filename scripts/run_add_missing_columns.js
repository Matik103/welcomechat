
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running migration to add missing columns to ai_agents table...');

try {
  // Path to the migration file
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20240927_add_missing_columns_to_ai_agents.sql');
  
  // Check if the migration file exists
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file not found:', migrationFile);
    process.exit(1);
  }
  
  // Execute the migration using the Supabase CLI
  execSync('npx supabase migration up', { stdio: 'inherit' });
  
  console.log('Migration completed successfully! All missing columns have been added to the ai_agents table.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
