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
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ) as exists
    `;
    
    // Direct query with JSON result
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT json_build_object('exists', (${query}))`
    });
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    // Parse the result correctly
    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0] as Record<string, any>;
      return result.exists === true;
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
    
    // Check if the exec_sql function exists by running a simple query
    try {
      const testResult = await supabase.rpc('exec_sql', {
        sql_query: 'SELECT json_build_object(\'test\', 1)'
      });
      
      if (testResult.error) {
        console.error("Error checking exec_sql function:", testResult.error);
      } else {
        console.log("exec_sql function is available:", testResult.data);
      }
    } catch (error) {
      console.error("Error checking exec_sql function:", error);
    }
    
    // Check if document_links table exists using a direct query
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT json_build_object('exists', EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'document_links'
          ))
        `
      });
      
      if (error) {
        console.error("Error checking document_links table:", error);
      } else if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0] as Record<string, any>;
        const exists = result.exists === true;
        console.log("document_links table exists:", exists);
      }
    } catch (error) {
      console.warn("document_links table check failed:", error);
    }
    
    // Check required functions with safer approaches
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
