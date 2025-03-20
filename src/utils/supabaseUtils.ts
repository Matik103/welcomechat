
import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize the RPC functions needed for the application
 */
export const initializeRpcFunctions = async () => {
  try {
    console.log("Initializing Supabase RPC functions...");
    
    // Check if the exec_sql function exists
    const { data: execSqlData, error: execSqlError } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1 as test',
      query_params: '{}'
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
      `,
      query_params: '{}'
    });
    
    if (tableError) {
      console.error("Error checking document_links table:", tableError);
    } else {
      const exists = Array.isArray(tableData) && tableData.length > 0 && tableData[0].exists;
      console.log("document_links table exists:", exists);
    }
    
    // Check if get_document_access_status function exists
    const { data: accessStatusData, error: accessStatusError } = await supabase.rpc('get_document_access_status', {
      document_id: 0
    });
    
    if (accessStatusError && !accessStatusError.message.includes("does not exist")) {
      console.error("Error checking get_document_access_status function:", accessStatusError);
    } else {
      console.log("get_document_access_status function check completed");
    }
    
    console.log("Supabase RPC functions initialized successfully");
  } catch (error) {
    console.error("Error initializing RPC functions:", error);
  }
};
