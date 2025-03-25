
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches top queries for a client
 * @param clientId The client ID
 * @param limit Number of top queries to return
 * @returns Array of top queries with their frequency
 */
export const fetchTopQueries = async (clientId: string, limit: number = 5) => {
  try {
    const { data, error } = await supabase.rpc('get_common_queries', {
      client_id_param: clientId,
      agent_name_param: null,
      limit_param: limit
    });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
};
