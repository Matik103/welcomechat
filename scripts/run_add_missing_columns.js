
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Running migration to add missing columns to ai_agents table...');

try {
  // Path to the migration file
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20240927_add_missing_columns_to_ai_agents.sql');
  
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
  
  console.log('Migration completed successfully! All missing columns have been added to the ai_agents table.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
