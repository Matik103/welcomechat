
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Migration file path
const migrationFile = path.join(__dirname, '../supabase/migrations/20240927_fix_missing_columns.sql');

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
    return true;
  } catch (error) {
    console.error('Migration failed:', error.message);
    return false;
  }
}

// Run the migration
const success = runMigration(migrationFile);

if (success) {
  console.log("Column fix migration complete. The database schema has been updated to include all required columns.");
  console.log("Please restart your development server to see the changes take effect.");
} else {
  console.error("Migration failed. Please check the error messages above.");
  process.exit(1);
}
