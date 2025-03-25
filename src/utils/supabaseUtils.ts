
import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction, execSql } from "./rpcUtils";

/**
 * Check if a table exists in the database
 * @param tableName The name of the table to check
 * @returns True if the table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Use proper JSON formatting in the query
    const query = `
      SELECT json_build_object('exists', (
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        )
      )) as result
    `;
    
    // Use the execSql function
    const data = await execSql(query);
    
    // Handle the result properly
    if (data && Array.isArray(data) && data.length > 0) {
      // The result will be in the format [{result: {exists: true|false}}]
      const row = data[0];
      if (row && typeof row === 'object' && 'result' in row) {
        const result = row.result;
        if (typeof result === 'object' && result !== null && 'exists' in result) {
          return Boolean(result.exists);
        }
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
    
    // Check if the exec_sql function exists by running a simple query
    try {
      const testQuery = "SELECT json_build_object('test', 1) as result";
      const testResult = await execSql(testQuery);
      
      console.log("exec_sql function is available:", testResult);
    } catch (error) {
      console.error("Error checking exec_sql function:", error);
    }
    
    // Check if document_processing table exists
    const docProcessingExists = await tableExists('document_processing');
    console.log("document_processing table exists:", docProcessingExists);
    
    // Check if document_links table exists using same method
    const docLinksExists = await tableExists('document_links');
    console.log("document_links table exists:", docLinksExists);
    
    // Check required functions with safer approaches
    try {
      await callRpcFunction('get_document_access_status', {
        document_id: 0
      });
      console.log("get_document_access_status function exists");
    } catch (error) {
      console.warn("get_document_access_status function check failed:", error);
    }
    
    console.log("Supabase RPC functions initialized successfully");
  } catch (error) {
    console.error("Error initializing RPC functions:", error);
  }
};
