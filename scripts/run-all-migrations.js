
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

// Verify the document-storage bucket and create it directly if needed
console.log('\nVerifying "document-storage" storage bucket...');
try {
  const verifyCommand = `psql "${dbUrl}" -c "SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'document-storage')"`;
  const result = execSync(verifyCommand).toString();
  
  if (result.includes('t')) {
    console.log('✅ The "document-storage" bucket exists in storage');
  } else {
    console.log('❌ The "document-storage" bucket does not exist in storage');
    console.log('Creating the bucket directly...');
    
    const createBucketCommand = `psql "${dbUrl}" -c "INSERT INTO storage.buckets (id, name, public) VALUES ('document-storage', 'Document Storage', true) ON CONFLICT (id) DO NOTHING;"`;
    execSync(createBucketCommand);
    
    // Verify again
    const verifyAgain = execSync(`psql "${dbUrl}" -c "SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'document-storage')"`).toString();
    if (verifyAgain.includes('t')) {
      console.log('✅ Successfully created the "document-storage" bucket');
    } else {
      console.log('❌ Failed to create the "document-storage" bucket');
    }
    
    // Apply policies
    console.log('Creating storage policies...');
    const policiesCommand = `psql "${dbUrl}" -c "
      BEGIN;
      DROP POLICY IF EXISTS \\"Allow authenticated users to upload their own documents\\" ON storage.objects;
      CREATE POLICY \\"Allow authenticated users to upload their own documents\\" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'document-storage');
      DROP POLICY IF EXISTS \\"Allow public read access to documents\\" ON storage.objects;
      CREATE POLICY \\"Allow public read access to documents\\" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'document-storage');
      COMMIT;
    "`;
    execSync(policiesCommand);
    console.log('✅ Storage policies created');
  }
} catch (error) {
  console.error('Error verifying or creating document-storage bucket:', error.message);
}
