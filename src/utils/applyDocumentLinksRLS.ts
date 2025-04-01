
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
        toast.success("Security policies updated successfully");
        return { success: true, data: result };
      } else {
        console.warn('Could not fetch SQL from storage:', sqlFileError);
      }
    } catch (storageError) {
      console.warn('Could not fetch SQL from storage, falling back to hardcoded SQL:', storageError);
    }
    
    // Fallback to hardcoded SQL if storage fetch fails
    const hardcodedSql = `
      -- Enable RLS on document_links table
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies for a clean slate
      DO $$
      DECLARE
        policy_name text;
      BEGIN
        FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'document_links' LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON document_links', policy_name);
        END LOOP;
      END $$;
      
      -- Create a fully permissive policy for all authenticated users
      CREATE POLICY "authenticated_full_access" 
          ON document_links
          FOR ALL 
          TO authenticated
          USING (true)
          WITH CHECK (true);
      
      -- Create a policy for service role with full access
      CREATE POLICY "service_role_all_access"
          ON document_links
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
          
      -- Grant necessary permissions
      GRANT ALL ON document_links TO authenticated;
      GRANT ALL ON document_links TO service_role;
    `;
    
    // Execute the hardcoded SQL
    const result = await execSql(hardcodedSql);
    
    console.log('Successfully applied document_links RLS policies using hardcoded SQL:', result);
    toast.success("Security policies updated successfully");
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
  try {
    // First, try with our primary approach
    const result = await applyDocumentLinksRLS();
    
    if (result.success) {
      console.log("Successfully fixed document_links RLS policies");
      return result;
    }
    
    // If that fails, try a direct approach with minimal SQL
    console.log("First attempt failed, trying direct approach...");
    const directSql = `
      -- Most direct approach possible - drop everything and create one simple policy
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies first
      DO $$
      DECLARE
        policy_name text;
      BEGIN
        FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'document_links' LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON document_links', policy_name);
        END LOOP;
      END $$;
      
      -- Create one super simple policy
      CREATE POLICY "full_access_policy" 
      ON document_links
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
      
      -- Grant all permissions
      GRANT ALL ON document_links TO authenticated;
      GRANT ALL ON document_links TO service_role;
    `;
    
    const directResult = await execSql(directSql);
    console.log("Result of direct approach:", directResult);
    
    toast.success("Security policies updated successfully");
    return { success: true, data: directResult };
  } catch (error) {
    console.error("Failed to fix document_links RLS policies:", error);
    
    // Last resort attempt - use the simplest possible approach
    try {
      console.log("Trying last resort approach...");
      const lastResortSql = `
        ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "emergency_policy" ON document_links;
        CREATE POLICY "emergency_policy" ON document_links FOR ALL USING (true);
        GRANT ALL ON document_links TO authenticated;
      `;
      
      const lastResortResult = await execSql(lastResortSql);
      console.log("Last resort approach result:", lastResortResult);
      
      toast.success("Emergency security policy applied");
      return { success: true, data: lastResortResult };
    } catch (finalError) {
      console.error("All attempts to fix RLS policies failed:", finalError);
      toast.error("Failed to update security policies. Please contact support.");
      
      return { 
        success: false, 
        error: finalError instanceof Error ? finalError.message : 'Unknown error' 
      };
    }
  }
};
