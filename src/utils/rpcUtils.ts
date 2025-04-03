
import { supabase } from '@/integrations/supabase/client';

/**
 * Safely call a Supabase RPC function with error handling
 * This version accepts any function name and parameters
 */
export const callRpcFunctionSafe = async <T>(
  functionName: string, 
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    // @ts-ignore - We need to bypass TypeScript's function name checking
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      return { data: null, error };
    }
    
    // Type assertion to ensure the data is treated as type T
    return { data: data as T, error: null };
  } catch (error) {
    console.error(`Failed to call RPC function ${functionName}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(`Unknown error in ${functionName}`) 
    };
  }
};

/**
 * Alias for callRpcFunctionSafe for backward compatibility
 */
export const callRpcFunction = callRpcFunctionSafe;

/**
 * Execute a raw SQL query via RPC with performance optimizations
 * Uses the correct parameter names for the exec_sql function
 */
export const execSql = async <T>(
  query: string, 
  params: any[] = []
): Promise<T> => {
  try {
    // Only log first part of query to avoid console bloat
    const previewLength = Math.min(query.length, 100);
    console.log("Executing SQL:", query.substring(0, previewLength) + (query.length > previewLength ? "..." : ""));
    
    // Add a timeout to prevent long-running queries
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('SQL query execution timed out after 8 seconds'));
      }, 8000);
    });
    
    // Execute the query
    const queryPromise = supabase.rpc('exec_sql', { 
      sql_query: query,
      query_params: params 
    });
    
    // Race between query and timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => { throw new Error('Query timeout'); })
    ]) as any;
    
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

/**
 * Execute a SQL query for RLS policy updates with better performance
 */
export const executeRlsUpdate = async (sqlQuery: string): Promise<boolean> => {
  try {
    // Use a simplified version of the query for better performance
    const simplifiedQuery = sqlQuery
      .replace(/--.*$/gm, '') // Remove comments
      .replace(/\s+/g, ' ')   // Collapse whitespace
      .trim();
    
    console.log("Executing RLS policy update...");
    
    // Add a timeout to prevent long-running queries
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('RLS update timed out after 5 seconds'));
      }, 5000);
    });
    
    // Execute the query
    const queryPromise = supabase.rpc('exec_sql', { 
      sql_query: simplifiedQuery
    });
    
    // Race between query and timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => { throw new Error('RLS update timeout'); })
    ]) as any;
    
    if (error) {
      console.error('Error executing RLS update:', error);
      return false;
    }
    
    console.log("RLS policy update successful");
    return true;
  } catch (error) {
    console.error('Failed to execute RLS update:', error);
    return false;
  }
};
