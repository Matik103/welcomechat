
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
