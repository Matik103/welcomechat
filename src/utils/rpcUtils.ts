
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic function to call RPC functions in Supabase
 * 
 * @param functionName The name of the RPC function to call
 * @param params Parameters to pass to the function
 * @returns The result of the function call
 */
export const callRpcFunction = async (
  functionName: string, 
  params: Record<string, any>
): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling ${functionName} RPC function:`, error);
      throw error;
    }
    
    return data;
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
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlQuery,
      params: params
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
