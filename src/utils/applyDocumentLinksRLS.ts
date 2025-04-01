
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { execSql } from './rpcUtils';

export const applyDocumentLinksRLS = async () => {
  try {
    console.log("Attempting to apply document_links RLS policies...");
    
    // Try to fetch the SQL content from the storage bucket first
    try {
      const { data: sqlFileData, error: sqlFileError } = await supabase.storage
        .from('sql-scripts')
        .download('update_document_links_rls.sql');
      
      if (!sqlFileError && sqlFileData) {
        // Convert the SQL file content to text
        const sqlContent = await sqlFileData.text();
        
        // Execute the SQL directly using exec_sql RPC function
        const result = await execSql(sqlContent);
        console.log('Successfully applied document_links RLS policies from storage:', result);
        return { success: true, data: result };
      }
    } catch (storageError) {
      console.warn('Could not fetch SQL from storage, falling back to hardcoded SQL:', storageError);
    }
    
    // Fallback to hardcoded SQL if storage fetch fails
    const hardcodedSql = `
      -- Enable RLS on document_links table
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies
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
      
      -- Create a policy for service role (admin access)
      CREATE POLICY "service_role_all_access"
          ON document_links
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      
      -- Create a completely permissive policy for authenticated users
      CREATE POLICY "authenticated_all_access"
          ON document_links
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
    `;
    
    // Execute the hardcoded SQL
    const result = await execSql(hardcodedSql);
    
    console.log('Successfully applied document_links RLS policies using hardcoded SQL:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error applying RLS policies:', error);
    toast.error('Failed to update security policies. Please try again or contact support.');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// This function can be called to directly fix RLS issues
export const fixDocumentLinksRLS = async () => {
  console.log("Attempting to fix document_links RLS policies...");
  const result = await applyDocumentLinksRLS();
  
  if (result.success) {
    console.log("Successfully fixed document_links RLS policies");
    toast.success("Security policies updated successfully");
  } else {
    console.error("Failed to fix document_links RLS policies:", result.error);
    toast.error("Failed to update security policies");
  }
  
  return result;
};
