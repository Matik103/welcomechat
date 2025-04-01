
import { supabase } from '@/integrations/supabase/client';

export const createSqlScriptsBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check if the bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'sql-scripts');
    
    if (!bucketExists) {
      console.log('Creating sql-scripts bucket...');
      const { data, error } = await supabase.storage.createBucket('sql-scripts', {
        public: false,
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
    
    // Get the SQL file content from the public path
    let sqlContent;
    try {
      console.log('Fetching SQL file from public path...');
      const response = await fetch('/supabase/sql/update_document_links_rls.sql');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SQL file: ${response.status} ${response.statusText}`);
      }
      
      sqlContent = await response.text();
      console.log('SQL file fetched successfully, length:', sqlContent.length);
    } catch (fetchError) {
      console.error('Error fetching SQL file from public path:', fetchError);
      
      // Use hardcoded SQL as fallback
      console.log('Using hardcoded SQL as fallback');
      sqlContent = `
        -- Enable RLS on document_links table
        ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
        
        -- Drop all existing policies for a clean slate
        DROP POLICY IF EXISTS "service_role_all_access" ON document_links;
        DROP POLICY IF EXISTS "authenticated_users_access" ON document_links;
        DROP POLICY IF EXISTS "anon_read_only" ON document_links;
        
        -- Create simple policies for development
        CREATE POLICY "service_role_all_access"
            ON document_links
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        
        CREATE POLICY "authenticated_users_access"
            ON document_links
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        
        CREATE POLICY "anon_read_only"
            ON document_links
            FOR SELECT
            TO anon
            USING (true);
      `;
    }
    
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
    
    // Also apply the RLS policies right away
    const { success: rlsSuccess } = await import('@/utils/applyDocumentLinksRLS')
      .then(module => module.applyDocumentLinksRLS());
    
    console.log("Initial RLS policies application result:", rlsSuccess);
    
    return bucketsResult && rlsSuccess;
  } catch (error) {
    console.error("Error initializing SQL resources:", error);
    return false;
  }
};
