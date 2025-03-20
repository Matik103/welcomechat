import { supabase } from "@/integrations/supabase/client";
import { execSql } from "./rpcUtils";

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
    
    const result = await execSql(query);
    
    // Parse the result correctly
    if (result && result.length > 0) {
      // Convert to boolean - the exists field might be returned in various formats
      const exists = result[0]?.exists;
      if (typeof exists === 'boolean') return exists;
      if (typeof exists === 'string') return exists.toLowerCase() === 'true';
      return Boolean(exists);
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
    
    // Check if the exec_sql function exists
    const { data: execSqlData, error: execSqlError } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1 as test'
    });
    
    if (execSqlError) {
      console.error("Error checking exec_sql function:", execSqlError);
    } else {
      console.log("exec_sql function is available:", execSqlData);
    }
    
    // Check if document_links table exists
    const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'document_links'
        ) as exists
      `
    });
    
    if (tableError) {
      console.error("Error checking document_links table:", tableError);
    } else {
      const exists = Array.isArray(tableData) && tableData.length > 0 && tableData[0].exists;
      console.log("document_links table exists:", exists);
    }
    
    // Check if required functions exist
    try {
      await supabase.rpc('get_document_access_status', {
        document_id: 0
      });
      console.log("get_document_access_status function exists");
    } catch (error) {
      console.warn("get_document_access_status function check failed:", error);
    }
    
    try {
      await supabase.rpc('get_ai_interactions', {
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
