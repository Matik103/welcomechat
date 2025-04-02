
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { executeRlsUpdate } from '@/utils/rpcUtils';

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

    // Now fix the storage bucket RLS policies for the existing bucket
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
        USING (bucket_id = 'document-storage')
        WITH CHECK (bucket_id = 'document-storage');
      
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

// Function to ensure the document-storage bucket exists - but now just verifies without creating
export const ensureDocumentStorageBucket = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("Checking if document-storage bucket exists...");
    
    // Check with regular client - we're just verifying the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return { 
        success: false, 
        message: `Error checking bucket: ${listError.message}` 
      };
    }
    
    // Check if bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'document-storage');
    
    if (!bucketExists) {
      console.error("Required bucket 'document-storage' does not exist");
      return { 
        success: false, 
        message: "The required storage bucket 'document-storage' does not exist. Please contact an administrator to create it." 
      };
    }
    
    console.log("document-storage bucket exists, setting permissions");
    
    // Set proper RLS permissions for the existing bucket using the RLS update function
    const success = await executeRlsUpdate(`
      -- Ensure proper RLS for the bucket
      DROP POLICY IF EXISTS "Enable storage access for all users" ON storage.objects;
      
      CREATE POLICY "Enable storage access for all users"
        ON storage.objects FOR ALL
        USING (bucket_id = 'document-storage')
        WITH CHECK (bucket_id = 'document-storage');
        
      -- Grant necessary permissions
      GRANT ALL ON storage.objects TO authenticated;
      GRANT ALL ON storage.objects TO service_role;
    `);

    if (!success) {
      console.error('Error setting permissions on document-storage bucket');
      return { 
        success: false, 
        message: "Failed to set permissions on the document storage bucket. Please contact support." 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in ensureDocumentStorageBucket:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

// Comprehensive function to fix all document permissions issues
export const fixAllDocumentPermissions = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // First ensure the bucket exists
    const bucketResult = await ensureDocumentStorageBucket();
    if (!bucketResult.success) {
      return bucketResult;
    }
    
    // Then fix the RLS policies
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
