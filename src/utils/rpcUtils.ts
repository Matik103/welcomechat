
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
 * Fixed to use the correct parameter names (sql_query instead of query_text)
 */
export const execSql = async <T>(
  query: string, 
  params: any[] = []
): Promise<T> => {
  try {
    const { data, error } = await supabase.rpc('exec_sql' as any, { 
      sql_query: query,
      query_params: params 
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error('Failed to execute SQL:', error);
    throw error;
  }
};
