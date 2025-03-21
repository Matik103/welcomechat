
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the number of active days for a client
 * @param client_id The client ID
 * @param agent_name Optional agent name parameter
 * @returns The number of active days
 */
export const getActiveDays = async (client_id: string, agent_name?: string): Promise<number> => {
  try {
    // Get active days using direct SQL query
    const query = `
      SELECT COUNT(DISTINCT DATE(created_at)) as count
      FROM ai_agents
      WHERE client_id = '${client_id}'
      ${agent_name ? `AND name = '${agent_name}'` : ''}
      AND interaction_type = 'chat_interaction'
    `;
    
    const result = await callRpcFunction<any[]>('exec_sql', { sql_query: query });
    
    if (result && Array.isArray(result) && result.length > 0) {
      const count = parseInt(result[0].count, 10);
      return isNaN(count) ? 0 : count;
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting active days:", error);
    return 0;
  }
};
