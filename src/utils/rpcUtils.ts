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

interface SqlQuery {
  sql: string;
  values: any[];
}

export const execSql = async (query: SqlQuery | string): Promise<any[]> => {
  try {
    const response = await fetch('/api/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typeof query === 'string' ? { sql: query } : query),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
};
