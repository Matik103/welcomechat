
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';

interface QueryFrequency {
  query_text: string;
  frequency: number;
}

/**
 * Get the most common queries for a client's agent
 */
export async function getTopQueries(
  clientId: string,
  agentName: string,
  limit: number = 5
): Promise<QueryFrequency[]> {
  try {
    const data = await callRpcFunction('get_common_queries', {
      client_id_param: clientId,
      agent_name_param: agentName,
      limit_param: limit
    });
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
}

/**
 * Get the most common queries across all clients (admin view)
 */
export async function getGlobalTopQueries(limit: number = 10): Promise<QueryFrequency[]> {
  try {
    const { data, error } = await supabase
      .from('common_queries')
      .select('query_text, frequency')
      .order('frequency', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching global top queries:', error);
    return [];
  }
}
