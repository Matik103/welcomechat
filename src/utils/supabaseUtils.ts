
import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction } from "./rpcUtils";

/**
 * Check if a table exists in the database
 * @param tableName The name of the table to check
 * @returns True if the table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ) as exists
    `;
    
    const result = await callRpcFunction('exec_sql', {
      sql_query: query
    });
    
    // Parse the result correctly - handle different return formats
    if (result && typeof result === 'object') {
      if (Array.isArray(result) && result.length > 0) {
        // If an array is returned, extract the exists value
        const exists = result[0]?.exists;
        return typeof exists === 'boolean' ? exists : 
               typeof exists === 'string' ? exists.toLowerCase() === 'true' : 
               Boolean(exists);
      } else if ('exists' in (result as any)) {
        // If a direct object is returned
        return Boolean((result as any).exists);
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Initialize the RPC functions needed for the application
 */
export const initializeRpcFunctions = async () => {
  try {
    console.log("Initializing Supabase RPC functions...");
    
    // Check if the exec_sql function exists - use a direct try/catch approach
    try {
      const testResult = await callRpcFunction('exec_sql', {
        sql_query: 'SELECT 1 as test'
      });
      
      if (!testResult) {
        console.error("Error checking exec_sql function: No result returned");
      } else {
        console.log("exec_sql function is available:", testResult);
      }
    } catch (error) {
      console.error("Error checking exec_sql function:", error);
    }
    
    // Check if document_links table exists - use a direct query
    try {
      const tableCheckResult = await callRpcFunction('exec_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'document_links'
          ) as exists
        `
      });
      
      // The result may be in different formats depending on how the RPC function is implemented
      let exists = false;
      const data = tableCheckResult;
      
      if (Array.isArray(data) && data.length > 0 && data[0]) {
        const firstItem = data[0] as Record<string, any>;
        exists = Boolean(firstItem.exists);
      } else if (typeof data === 'object' && data !== null) {
        exists = Boolean((data as any).exists);
      } else if (typeof data === 'boolean') {
        exists = data;
      }
      
      console.log("document_links table exists:", exists);
    } catch (error) {
      console.warn("document_links table check failed:", error);
    }
    
    // Check if required functions exist
    try {
      await callRpcFunction('get_document_access_status', {
        document_id: 0
      });
      console.log("get_document_access_status function exists");
    } catch (error) {
      console.warn("get_document_access_status function check failed:", error);
    }
    
    try {
      await callRpcFunction('get_ai_interactions', {
        client_id_param: '00000000-0000-0000-0000-000000000000'
      });
      console.log("get_ai_interactions function exists");
    } catch (error) {
      console.warn("get_ai_interactions function check failed:", error);
    }
    
    console.log("Supabase RPC functions initialized successfully");
  } catch (error) {
    console.error("Error initializing RPC functions:", error);
  }
};
