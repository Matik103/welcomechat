
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the number of interactions for a client
 * @param client_id The client ID
 * @param agent_name Optional agent name parameter
 * @returns The number of interactions
 */
export const getInteractionCount = async (client_id: string, agent_name?: string): Promise<number> => {
  try {
    // Try to get direct count from ai_agents table using SQL
    const query = `
      SELECT COUNT(*) as count
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
    console.error("Error getting interaction count:", error);
    return 0;
  }
};
