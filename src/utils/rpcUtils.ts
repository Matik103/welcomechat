
import { supabase } from "@/integrations/supabase/client";

/**
 * Executes a SQL query against the database using RPC
 * @param sqlQuery The SQL query to execute
 * @param params Optional parameters for the query
 * @returns The result of the query
 */
export const execSql = async (sqlQuery: string, params?: any) => {
  try {
    // Need to use a generic call since "execute_sql" isn't in the typed list
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlQuery,
      query_params: params || {}
    } as any);

    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in execSql:', error);
    throw error;
  }
};

/**
 * Generic function to call any RPC with proper typing
 * @param functionName The name of the RPC function to call
 * @param params Parameters to pass to the function
 * @returns The result of the RPC call
 */
export const callRpcFunction = async <T = any>(functionName: string, params?: any): Promise<T> => {
  try {
    const { data, error } = await supabase.rpc(functionName as any, params as any);

    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }

    return data as T;
  } catch (error) {
    console.error(`Error in callRpcFunction for ${functionName}:`, error);
    throw error;
  }
};
