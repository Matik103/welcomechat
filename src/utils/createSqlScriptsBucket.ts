
import { supabase } from '@/integrations/supabase/client';

export const createSqlScriptsBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check if the bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'sql-scripts');
    
    if (!bucketExists) {
      console.log('Creating sql-scripts bucket...');
      const { data, error } = await supabase.storage.createBucket('sql-scripts', {
        public: false, // Private bucket for SQL scripts
        allowedMimeTypes: ['text/plain', 'application/sql', 'text/x-sql'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error creating sql-scripts bucket:', error);
        // Continue anyway, in case the bucket actually exists but there was an error listing it
        console.log('Continuing despite bucket creation error...');
      } else {
        console.log('Created sql-scripts bucket:', data);
      }
    } else {
      console.log('sql-scripts bucket already exists');
    }
    
    // Get the SQL file content - always use the hardcoded SQL for consistent approach
    // This ensures we don't depend on external file fetching which can fail
    console.log('Using hardcoded SQL to ensure consistency');
    const sqlContent = `
      -- Enable RLS on document_links table
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies for a clean slate
      DROP POLICY IF EXISTS "Service role has full access to document links" ON document_links;
      DROP POLICY IF EXISTS "Authenticated users can manage document links" ON document_links;
      DROP POLICY IF EXISTS "Users can view their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can insert their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can update their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can delete their own document links" ON document_links;
      DROP POLICY IF EXISTS "delete_document_links" ON document_links;
      DROP POLICY IF EXISTS "insert_document_links" ON document_links;
      DROP POLICY IF EXISTS "select_document_links" ON document_links;
      DROP POLICY IF EXISTS "update_document_links" ON document_links;
      DROP POLICY IF EXISTS "service_role_all_access" ON document_links;
      DROP POLICY IF EXISTS "authenticated_users_access" ON document_links;
      DROP POLICY IF EXISTS "anon_read_only" ON document_links;
      DROP POLICY IF EXISTS "authenticated_can_do_anything" ON document_links;
      
      -- Super permissive policy for development
      CREATE POLICY "authenticated_can_do_anything" 
          ON document_links
          FOR ALL 
          TO authenticated
          USING (true)
          WITH CHECK (true);
      
      -- Create a simple policy for service role with full access
      CREATE POLICY "service_role_all_access"
          ON document_links
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      
      -- Create a policy for anon users to view only
      CREATE POLICY "anon_read_only"
          ON document_links
          FOR SELECT
          TO anon
          USING (true);
      
      -- Grant necessary permissions to the document_links table
      GRANT ALL ON document_links TO authenticated;
      GRANT SELECT ON document_links TO anon;
      GRANT ALL ON document_links TO service_role;
    `;
    
    // Upload the SQL file (always refresh it to ensure latest version)
    if (sqlContent) {
      console.log('Uploading SQL content to storage...');
      const { error: uploadError } = await supabase.storage
        .from('sql-scripts')
        .upload('update_document_links_rls.sql', new Blob([sqlContent], { type: 'application/sql' }), {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading SQL file:', uploadError);
        return false;
      }
      
      console.log('Uploaded SQL file to sql-scripts bucket');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting up sql-scripts bucket:', error);
    return false;
  }
};

// Create a function to initialize SQL resources that can be called during app startup
export const initializeSqlResources = async () => {
  console.log("Initializing SQL resources...");
  
  try {
    // Create bucket and upload SQL scripts
    const bucketsResult = await createSqlScriptsBucket();
    console.log("SQL scripts bucket initialization result:", bucketsResult);
    
    // Also apply the RLS policies right away to ensure they're in place
    try {
      const { applyDocumentLinksRLS } = await import('@/utils/applyDocumentLinksRLS');
      const { success: rlsSuccess } = await applyDocumentLinksRLS();
      console.log("Initial RLS policies application result:", rlsSuccess);
      return bucketsResult && rlsSuccess;
    } catch (rlsError) {
      console.error("Error applying RLS policies:", rlsError);
      return bucketsResult; // Return true if at least the bucket was created
    }
  } catch (error) {
    console.error("Error initializing SQL resources:", error);
    return false;
  }
};
