
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

// Function to run SQL file against Supabase database
function runMigration() {
  // Get migration file path
  const sqlFilePath = path.join(__dirname, '../supabase/migrations/20240930_add_openai_assistant_id.sql');
  
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
    console.log(`Running OpenAI Assistant migration to add required columns...`);
    
    // Using psql to run the SQL
    const command = `psql "${dbUrl}" -f "${sqlFilePath}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('Migration completed successfully!');
    console.log('The openai_assistant_id column has been added to the ai_agents table.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
