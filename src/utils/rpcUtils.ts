
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic function to call RPC functions in Supabase
 * 
 * @param functionName The name of the RPC function to call
 * @param params Parameters to pass to the function
 * @returns The result of the function call
 */
export const callRpcFunction = async <T = any>(
  functionName: string, 
  params: Record<string, any>
): Promise<T> => {
  try {
    // Special handling for activity_type to ensure it passes through the enum check
    if (params.activity_type_param) {
      console.log(`Converting activity type: ${params.activity_type_param}`);
      // The backend function expects a specific enum format
      params.activity_type_param = String(params.activity_type_param);
    }
    
    // Call the RPC function dynamically
    // @ts-ignore - We need to ignore type checking for dynamic function names
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling ${functionName} RPC function:`, error);
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error in callRpcFunction (${functionName}):`, error);
    throw error;
  }
};

/**
 * Executes a SQL query via Supabase's exec_sql RPC function
 * 
 * @param sqlQuery The SQL query to execute
 * @param params Optional parameters to pass to the query
 * @returns The result of the SQL query
 */
export const execSql = async (
  sqlQuery: string,
  params: any[] = []
): Promise<any> => {
  try {
    // Call the exec_sql RPC function
    // @ts-ignore - We need to ignore type checking for the RPC function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlQuery,
      query_params: params.length > 0 ? JSON.stringify(params) : null
    });
    
    if (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in execSql:', error);
    throw error;
  }
};
