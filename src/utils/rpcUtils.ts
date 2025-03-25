
import { supabase } from '@/integrations/supabase/client';

/**
 * A utility function for making RPC calls to Supabase
 * This function bypasses TypeScript's strict type checking for RPC calls
 * which is useful when the server-side functions have different parameter structures
 * than what TypeScript expects
 */
export const callRpcFunction = async (
  functionName: string, 
  params: Record<string, any>
) => {
  try {
    // Cast to any to bypass TypeScript's type checking
    const { data, error } = await (supabase.rpc as any)(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Exception in RPC function ${functionName}:`, err);
    throw err;
  }
};

/**
 * A utility function for executing SQL queries directly
 * This is useful for operations that can't be performed through the regular Supabase API
 */
export const execSql = async (
  sqlQuery: string,
  params: any[] = []
) => {
  try {
    // Call the exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlQuery,
      query_params: JSON.stringify(params)
    });
    
    if (error) {
      console.error(`Error executing SQL:`, error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Exception executing SQL:`, err);
    throw err;
  }
};
