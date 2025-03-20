
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";
import { QueryItem } from "@/types/client-dashboard";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Fetches the top queries for a client
 */
export const fetchTopQueries = async (clientId: string): Promise<QueryItem[]> => {
  if (!clientId) return [];
  
  try {
    // Ensure auth is valid
    await checkAndRefreshAuth();
    
    // Use the RPC function to get common queries
    const data = await callRpcFunction<Array<{query_text: string, frequency: number}>>(
      'get_common_queries', 
      {
        client_id_param: clientId,
        agent_name_param: null,
        limit_param: 5
      }
    );
    
    if (!data || !Array.isArray(data)) {
      console.log("No data or invalid data format returned from get_common_queries");
      return [];
    }
    
    // Return the data with the correct format
    return data.map(item => ({
      id: `query-${item.query_text.substring(0, 10)}`,
      query_text: item.query_text,
      frequency: item.frequency || 1
    }));
  } catch (err) {
    console.error("Error fetching top queries:", err);
    return [];
  }
};
