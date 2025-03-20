
import { supabase } from "@/integrations/supabase/client";

/**
 * Executes a SQL query against the database using RPC
 * @param sqlQuery The SQL query to execute
 * @param params Optional parameters for the query
 * @returns The result of the query
 */
export const execSql = async (sqlQuery: string, params?: any) => {
  try {
    // Use the generic callRpcFunction instead of direct RPC call
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlQuery,
      // Only include query_params if they exist to prevent errors
      ...(params ? { query_params: params } : {})
    });

    if (error) {
      console.error('Error in execSql:', error);
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
    // Using any to bypass TypeScript's strict checking for RPC function names
    // This is necessary because we need to call functions dynamically
    const { data, error } = await (supabase.rpc as any)(functionName, params);
    
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

/**
 * Call RPC function with void return type
 * Don't check result for truthiness
 */
export const callRpcFunctionVoid = async (functionName: string, params?: any): Promise<void> => {
  try {
    const { error } = await (supabase.rpc as any)(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error in callRpcFunctionVoid for ${functionName}:`, error);
    throw error;
  }
};
