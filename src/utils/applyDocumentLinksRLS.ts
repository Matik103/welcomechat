
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { execSql } from './rpcUtils';

export const applyDocumentLinksRLS = async () => {
  try {
    console.log("Attempting to apply document_links RLS policies...");
    
    // Simplified SQL with a more direct approach
    const simplifiedSql = `
      -- Enable RLS on document_links table
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Create a temporary function to drop all existing policies
      CREATE OR REPLACE FUNCTION temp_drop_all_document_links_policies() RETURNS void AS $$
      DECLARE
        policy_name text;
      BEGIN
        FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'document_links' LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON document_links', policy_name);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Execute the function to drop all policies
      SELECT temp_drop_all_document_links_policies();
      
      -- Drop the temporary function
      DROP FUNCTION temp_drop_all_document_links_policies();
      
      -- Create a simple permissive policy for all authenticated users
      CREATE POLICY "authenticated_can_do_everything" 
      ON document_links
      FOR ALL 
      TO authenticated
      USING (true) 
      WITH CHECK (true);
      
      -- Grant all permissions
      GRANT ALL ON document_links TO authenticated;
      GRANT ALL ON document_links TO service_role;
    `;
    
    // Execute the simplified SQL
    const result = await execSql(simplifiedSql);
    
    console.log('Successfully applied document_links RLS policies:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error applying RLS policies:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// This function can be called to directly fix RLS issues - simplified for better performance
export const fixDocumentLinksRLS = async () => {
  console.log("Attempting to fix document_links RLS policies...");
  try {
    // Use the most direct approach possible
    const directSql = `
      -- Enable RLS
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop all existing policies
      DO $$ 
      DECLARE
        policy_name text;
      BEGIN
        FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'document_links' LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON document_links', policy_name);
        END LOOP;
      END $$;
      
      -- Create one simple policy
      CREATE POLICY "full_access_policy" 
      ON document_links
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
      
      -- Grant permissions
      GRANT ALL ON document_links TO authenticated;
    `;
    
    const result = await execSql(directSql);
    console.log("Result of direct approach:", result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to fix document_links RLS policies:", error);
    
    // Last resort - extremely simplified query
    try {
      const emergencySql = `
        ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "emergency_policy" ON document_links;
        CREATE POLICY "emergency_policy" ON document_links FOR ALL USING (true);
        GRANT ALL ON document_links TO authenticated;
      `;
      
      const emergencyResult = await execSql(emergencySql);
      console.log("Emergency approach result:", emergencyResult);
      
      return { success: true, data: emergencyResult };
    } catch (finalError) {
      console.error("All attempts failed:", finalError);
      return { 
        success: false, 
        error: finalError instanceof Error ? finalError.message : 'Unknown error' 
      };
    }
  }
};
