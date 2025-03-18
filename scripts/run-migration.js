
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to run SQL file against Supabase database
function runMigration(sqlFilePath) {
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Migration file not found: ${sqlFilePath}`);
    process.exit(1);
  }

  // Try to get DB URL from different possible environment variables
  const dbUrl = process.env.SUPABASE_DB_URL || 
                process.env.DATABASE_URL || 
                process.env.DB_URL;
  
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL environment variable not set!');
    console.error('Please set it to run migrations, e.g:');
    console.error('export SUPABASE_DB_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"');
    process.exit(1);
  }

  try {
    console.log(`Running migration: ${path.basename(sqlFilePath)}`);
    
    // Using psql to run the SQL
    const command = `psql "${dbUrl}" -f "${sqlFilePath}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Get the migration file from command-line arguments or use default
const migrationFile = process.argv[2] || path.join(__dirname, '../supabase/migrations/20240911_fix_ai_agents_migration.sql');
runMigration(migrationFile);
console.log("Migration process complete. Check the Supabase Dashboard to verify the data has been properly linked.");
