
import { QueryItem } from "@/types/client-dashboard";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Get the top queries for a client
 * @param clientId The client ID
 * @param agentName Optional agent name
 * @returns The top queries
 */
export const fetchTopQueries = async (clientId: string, agentName?: string): Promise<QueryItem[]> => {
  try {
    // Try to use the get_common_queries RPC function
    const results = await callRpcFunction<Array<{query_text: string, frequency: number}>>(
      'get_common_queries', 
      { 
        client_id_param: clientId,
        agent_name_param: agentName,
        limit_param: 5
      }
    );
    
    if (Array.isArray(results)) {
      return results.map(item => ({
        id: `query-${item.query_text.substring(0, 10)}`,
        query_text: item.query_text,
        frequency: item.frequency
      }));
    }
    
    // Fallback to direct SQL query if RPC fails
    const { data, error } = await callRpcFunction<any>('exec_sql', {
      sql_query: `
        SELECT query_text, COUNT(*) as frequency
        FROM ai_agents
        WHERE client_id = '${clientId}'
        ${agentName ? `AND name = '${agentName}'` : ''}
        AND interaction_type = 'chat_interaction'
        AND query_text IS NOT NULL
        GROUP BY query_text
        ORDER BY frequency DESC
        LIMIT 5
      `
    });
    
    if (error) throw error;
    
    return Array.isArray(data) 
      ? data.map(item => ({
          id: `query-${item.query_text.substring(0, 10)}`,
          query_text: item.query_text,
          frequency: parseInt(item.frequency)
        }))
      : [];
  } catch (error) {
    console.error("Error fetching top queries:", error);
    return [];
  }
};
