import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupBucket() {
  console.log('Setting up client_documents bucket...');
  
  try {
    // 1. Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }

    console.log('Found buckets:', buckets?.map(b => b.name));
    
    const documentBucket = buckets?.find(b => b.name === 'client_documents');
    
    if (!documentBucket) {
      console.log('client_documents bucket not found, creating...');
      
      // 2. Create the bucket with proper configuration
      const { data, error: createError } = await supabase.storage.createBucket('client_documents', {
        public: false,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          'application/pdf',
          'text/plain',
          'application/vnd.google-apps.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
        return;
      }
      
      console.log('Successfully created client_documents bucket');
      
      // 3. Set up RLS policies
      await setupPolicies();
      
    } else {
      console.log('client_documents bucket exists');
      
      // 4. Verify and update bucket configuration
      const { error: updateError } = await supabase.storage.updateBucket('client_documents', {
        public: false,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          'application/pdf',
          'text/plain',
          'application/vnd.google-apps.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (updateError) {
        console.error('Error updating bucket configuration:', updateError.message);
      } else {
        console.log('Bucket configuration updated successfully');
      }
    }
    
    // 5. Verify bucket is accessible
    const { data: testData, error: testError } = await supabase.storage
      .from('client_documents')
      .list();
      
    if (testError) {
      console.error('Error accessing bucket:', testError.message);
    } else {
      console.log('Bucket is accessible. Current contents:', testData?.length || 0, 'items');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function setupPolicies() {
  try {
    // Create policies for the bucket
    const policies = [
      {
        name: "Allow authenticated users to view their own documents",
        definition: `bucket_id = 'client_documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`,
        operation: 'SELECT'
      },
      {
        name: "Allow authenticated users to upload their own documents",
        definition: `bucket_id = 'client_documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`,
        operation: 'INSERT'
      },
      {
        name: "Allow authenticated users to update their own documents",
        definition: `bucket_id = 'client_documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`,
        operation: 'UPDATE'
      },
      {
        name: "Allow authenticated users to delete their own documents",
        definition: `bucket_id = 'client_documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`,
        operation: 'DELETE'
      }
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('create_storage_policy', {
        name: policy.name,
        definition: policy.definition,
        table: 'objects',
        schema: 'storage',
        operation: policy.operation
      });

      if (error) {
        console.error(`Error creating policy ${policy.name}:`, error.message);
      } else {
        console.log(`Successfully created policy: ${policy.name}`);
      }
    }
  } catch (error) {
    console.error('Error setting up policies:', error);
  }
}

// Run the setup
setupBucket().catch(console.error); 