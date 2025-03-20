
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Running migration to fix client schema...');

try {
  // Path to the migration file
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20240928_fix_client_schema.sql');
  
  // Check if the migration file exists
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file not found:', migrationFile);
    process.exit(1);
  }
  
  // Get database URL from environment variables
  const dbUrl = process.env.SUPABASE_DB_URL || 
                process.env.DATABASE_URL || 
                process.env.DB_URL;
  
  if (!dbUrl) {
    console.error('Database URL environment variable not set!');
    console.error('Please set SUPABASE_DB_URL, DATABASE_URL, or DB_URL to run migrations');
    process.exit(1);
  }
  
  // Execute the migration using psql
  console.log('Executing migration...');
  execSync(`psql "${dbUrl}" -f "${migrationFile}"`, { stdio: 'inherit' });
  
  console.log('\n✅ Migration completed successfully! Client schema has been fixed to properly handle agent descriptions.');
  console.log('✅ The create_new_client function has been updated to use widget_settings for agent_description.');
  console.log('\nPlease restart your development server to see the changes take effect.');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nTroubleshooting tips:');
  console.error('1. Check your database connection URL in the .env file');
  console.error('2. Make sure psql is installed and accessible from your command line');
  console.error('3. Try running the SQL manually in the Supabase dashboard SQL editor');
  process.exit(1);
}
