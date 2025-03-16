
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run SQL file against Supabase database
function runMigration(sqlFilePath) {
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Migration file not found: ${sqlFilePath}`);
    process.exit(1);
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL environment variable not set!');
    console.error('Please set it to run migrations, e.g:');
    console.error('export SUPABASE_DB_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"');
    process.exit(1);
  }

  try {
    console.log(`Running migration: ${path.basename(sqlFilePath)}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Using psql to run the SQL
    const command = `psql "${dbUrl}" -f "${sqlFilePath}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the fix migration
runMigration(path.join(__dirname, '../supabase/migrations/20240911_fix_ai_agents_migration.sql'));
