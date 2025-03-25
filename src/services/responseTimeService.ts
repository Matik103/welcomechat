
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the average response time for a client
 * @param client_id The client ID
 * @param agent_name Optional agent name parameter
 * @returns The average response time
 */
export const getAverageResponseTime = async (client_id: string, agent_name?: string): Promise<number> => {
  try {
    // Use direct SQL query to get average response time
    const query = `
      SELECT COALESCE(AVG(response_time_ms)::numeric / 1000, 0) as avg_time
      FROM ai_agents
      WHERE client_id = '${client_id}'
      ${agent_name ? `AND name = '${agent_name}'` : ''}
      AND interaction_type = 'chat_interaction'
      AND response_time_ms IS NOT NULL
    `;
    
    const result = await callRpcFunction<any[]>('exec_sql', { sql_query: query });
    
    if (result && Array.isArray(result) && result.length > 0) {
      const avgTime = parseFloat(result[0].avg_time);
      return !isNaN(avgTime) ? avgTime : 0;
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting average response time:", error);
    return 0;
  }
};
