
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
  console.log("\n=== DATABASE FIXES APPLIED SUCCESSFULLY ===");
  console.log("✅ Added agent_name column to clients table");
  console.log("✅ Added all required columns to ai_agents table");
  console.log("✅ Created database functions for client creation and queries");
  console.log("✅ Fixed existing records to have valid agent_name");
  console.log("\nPlease restart your development server to see the changes take effect.");
} else {
  console.error("\n=== DATABASE MIGRATION FAILED ===");
  console.error("Please check the error messages above and try again.");
  console.error("If you're using Supabase, make sure your database connection URL is correct.");
  console.error("You can find your DB URL in the Supabase dashboard under Project Settings > Database.");
  process.exit(1);
}
