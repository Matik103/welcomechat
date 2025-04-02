
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { executeRlsUpdate } from '@/utils/rpcUtils';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

// Function to fix document links RLS
export const fixDocumentLinksRLS = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("Starting to apply document links RLS policies...");
    
    // Use executeRlsUpdate for more reliable SQL execution
    const success = await executeRlsUpdate(`
      BEGIN;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own document links" ON public.document_links;
      DROP POLICY IF EXISTS "Users can insert their own document links" ON public.document_links;
      DROP POLICY IF EXISTS "Users can update their own document links" ON public.document_links;
      DROP POLICY IF EXISTS "Users can delete their own document links" ON public.document_links;
      DROP POLICY IF EXISTS "Service role has full access to document links" ON public.document_links;
      DROP POLICY IF EXISTS "authenticated_can_do_anything" ON public.document_links;
      DROP POLICY IF EXISTS "Enable document_links access for authenticated users" ON public.document_links;
      DROP POLICY IF EXISTS "Enable document_links access for service role" ON public.document_links;

      -- Create simple permissive policy for development
      CREATE POLICY "authenticated_can_do_anything" 
        ON document_links
        FOR ALL 
        TO authenticated
        USING (true)
        WITH CHECK (true);

      -- Also add service role policy
      CREATE POLICY "Service role has full access to document links"
        ON document_links
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

      -- Ensure RLS is enabled
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

      -- Grant necessary permissions
      GRANT ALL ON public.document_links TO authenticated;
      GRANT ALL ON public.document_links TO service_role;
      
      COMMIT;
    `);

    if (!success) {
      console.error('Error fixing document links RLS using executeRlsUpdate');
      return { success: false, message: 'Failed to update document links RLS policies' };
    }

    // Now check if storage bucket exists and fix its policies
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return { success: false, message: `Error checking buckets: ${bucketsError.message}` };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (bucketExists) {
      console.log(`${DOCUMENTS_BUCKET} bucket exists, updating RLS policies...`);
      
      // Create permissive RLS policies for the existing bucket
      const storageSuccess = await executeRlsUpdate(`
        BEGIN;
        
        -- Drop existing storage policies
        DROP POLICY IF EXISTS "Enable storage access for authenticated users" ON storage.objects;
        DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;
        
        -- Create permissive policies for development
        CREATE POLICY "Enable storage access for all users"
          ON storage.objects FOR ALL
          USING (bucket_id = '${DOCUMENTS_BUCKET}')
          WITH CHECK (bucket_id = '${DOCUMENTS_BUCKET}');
        
        -- Ensure RLS is enabled
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        
        -- Grant necessary permissions
        GRANT ALL ON storage.objects TO authenticated;
        GRANT ALL ON storage.objects TO service_role;
        
        COMMIT;
      `);

      if (!storageSuccess) {
        console.error('Error fixing storage RLS');
        return { success: false, message: 'Failed to update storage RLS policies' };
      }
      
      console.log('Successfully updated storage RLS policies');
    } else {
      // Try to create the bucket
      let bucketCreated = false;
      
      if (isAdminClientConfigured()) {
        try {
          console.log('Creating document-storage bucket using admin client...');
          await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET, {
            public: true,
            fileSizeLimit: 20971520, // 20MB
          });
          console.log('Successfully created document-storage bucket with admin client');
          bucketCreated = true;
        } catch (error) {
          console.error('Error creating bucket with admin client:', error);
          // Continue to try with regular client as fallback
        }
      }
      
      if (!bucketCreated) {
        try {
          console.log('Creating document-storage bucket using regular client...');
          await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
            public: true,
            fileSizeLimit: 20971520, // 20MB
          });
          console.log('Successfully created document-storage bucket with regular client');
          bucketCreated = true;
        } catch (error) {
          console.error('Error creating bucket with regular client:', error);
          return { 
            success: false, 
            message: `Unable to create ${DOCUMENTS_BUCKET} bucket. You might need admin privileges to create storage buckets.` 
          };
        }
      }
      
      if (bucketCreated) {
        // Also set bucket policies
        const storageSuccess = await executeRlsUpdate(`
          BEGIN;
          
          -- Create permissive policies for development
          CREATE POLICY "Enable storage access for all users"
            ON storage.objects FOR ALL
            USING (bucket_id = '${DOCUMENTS_BUCKET}')
            WITH CHECK (bucket_id = '${DOCUMENTS_BUCKET}');
          
          -- Ensure RLS is enabled
          ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
          
          -- Grant necessary permissions
          GRANT ALL ON storage.objects TO authenticated;
          GRANT ALL ON storage.objects TO service_role;
          
          COMMIT;
        `);
        
        if (!storageSuccess) {
          console.error('Error setting storage RLS policies after bucket creation');
          return { 
            success: true, 
            message: 'Created bucket successfully but failed to set optimal permissions'
          };
        }
      }
    }

    console.log("Successfully applied RLS policies");
    return { success: true, message: "Security policies updated successfully" };
  } catch (error) {
    console.error('Error in fixDocumentLinksRLS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

// Comprehensive function to fix all document permissions issues
export const fixAllDocumentPermissions = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // Just fix the RLS policies - we assume the bucket exists
    const rlsResult = await fixDocumentLinksRLS();
    return rlsResult;
  } catch (error) {
    console.error("Failed to fix document permissions:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};
