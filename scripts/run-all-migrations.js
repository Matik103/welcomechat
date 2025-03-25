
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Starting to run all migrations...');

// Get the database URL from environment variables
const dbUrl = process.env.SUPABASE_DB_URL || 
              process.env.DATABASE_URL || 
              process.env.DB_URL;

if (!dbUrl) {
  console.error('Error: Database URL not found in environment variables');
  console.error('Please set SUPABASE_DB_URL, DATABASE_URL, or DB_URL');
  process.exit(1);
}

// Get all migration files
const migrationsDir = path.join(__dirname, '../supabase/migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort to ensure proper order

console.log(`Found ${migrationFiles.length} migration files to run`);

// Run each migration
let successCount = 0;
let failCount = 0;

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  
  try {
    console.log(`Running migration: ${file}`);
    const command = `psql "${dbUrl}" -f "${filePath}"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Successfully applied migration: ${file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to apply migration ${file}: ${error.message}`);
    failCount++;
  }
}

console.log('\n=== Migration Summary ===');
console.log(`Total migrations: ${migrationFiles.length}`);
console.log(`Successful: ${successCount}`);
console.log(`Failed: ${failCount}`);

if (successCount === migrationFiles.length) {
  console.log('\n✅ All migrations were applied successfully!');
  console.log('Your database should now be fully set up, including storage buckets.');
} else {
  console.log('\n⚠️ Some migrations failed. Check the error messages above.');
}

// Verify the documents bucket
console.log('\nVerifying "documents" storage bucket...');
try {
  const verifyCommand = `psql "${dbUrl}" -c "SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents')"`;
  const result = execSync(verifyCommand).toString();
  
  if (result.includes('t')) {
    console.log('✅ The "documents" bucket exists in storage');
  } else {
    console.log('❌ The "documents" bucket does not exist in storage');
    console.log('Try running the migration 20240325_storage_bucket_setup.sql directly');
  }
} catch (error) {
  console.error('Error verifying documents bucket:', error.message);
}
