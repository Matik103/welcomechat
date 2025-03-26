
import { supabase } from '@/integrations/supabase/client';

/**
 * Safely call a Supabase RPC function with error handling
 */
export const callRpcFunctionSafe = async <T>(
  functionName: string, 
  params: Record<string, any> = {}
): Promise<T> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
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
