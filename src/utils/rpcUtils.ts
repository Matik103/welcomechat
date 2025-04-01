
import { supabase } from '@/integrations/supabase/client';

/**
 * Safely call a Supabase RPC function with error handling
 */
export const callRpcFunctionSafe = async <T>(
  functionName: string, 
  params: Record<string, any> = {}
): Promise<T> => {
  try {
    const { data, error } = await supabase.rpc(functionName as any, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Failed to call RPC function ${functionName}:`, error);
    throw error;
  }
};

/**
 * Alias for callRpcFunctionSafe for backward compatibility
 */
export const callRpcFunction = callRpcFunctionSafe;

/**
 * Execute a raw SQL query via RPC
 * Uses the correct parameter names for the exec_sql function
 */
export const execSql = async <T>(
  query: string, 
  params: any[] = []
): Promise<T> => {
  try {
    console.log("Executing SQL:", query.substring(0, 100) + "...");
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query,
      query_params: params 
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
    
    console.log("SQL execution successful");
    return data as T;
  } catch (error) {
    console.error('Failed to execute SQL:', error);
    throw error;
  }
};

/**
 * Execute a SQL query for RLS policy updates
 * This is a specialized function that handles RLS policy updates
 */
export const executeRlsUpdate = async (sqlQuery: string): Promise<boolean> => {
  try {
    console.log("Executing RLS policy update...");
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlQuery
    });
    
    if (error) {
      console.error('Error executing RLS update:', error);
      return false;
    }
    
    console.log("RLS policy update successful:", data);
    return true;
  } catch (error) {
    console.error('Failed to execute RLS update:', error);
    return false;
  }
};
