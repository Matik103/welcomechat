
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
    
    // First try with the standard parameter names
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query,
      query_params: params 
    });
    
    if (error) {
      console.error('Error executing SQL (attempt 1):', error);
      
      // If first attempt fails, try alternative parameter name
      const { data: data2, error: error2 } = await supabase.rpc('exec_sql', { 
        query: query,
        params: params 
      });
      
      if (error2) {
        console.error('Error executing SQL (attempt 2):', error2);
        throw error2;
      }
      
      console.log("SQL execution successful on second attempt");
      return data2 as T;
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
 * This is a specialized function that handles RLS policy updates with better error handling
 */
export const executeRlsUpdate = async (sqlQuery: string): Promise<boolean> => {
  try {
    console.log("Executing RLS policy update...");
    
    // Using service_role key for this operation (through the RPC function)
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlQuery
    });
    
    if (error) {
      console.error('Error executing RLS update:', error);
      // Try to provide more specific error information
      if (error.message.includes('permission denied')) {
        console.error('Permission denied - make sure the RPC function has appropriate privileges');
      } else if (error.message.includes('syntax error')) {
        console.error('SQL syntax error in the RLS policy');
      }
      return false;
    }
    
    console.log("RLS policy update successful:", data);
    return true;
  } catch (error) {
    console.error('Failed to execute RLS update:', error);
    return false;
  }
};
