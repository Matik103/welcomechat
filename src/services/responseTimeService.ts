
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the average response time for a client
 * @param client_id The client ID
 * @param agent_name Optional agent name parameter
 * @returns The average response time
 */
export const getAverageResponseTime = async (client_id: string, agent_name?: string): Promise<number> => {
  try {
    // Use the client's agent_name if not provided
    if (!agent_name) {
      try {
        // First try to get the client to find its agent_name
        const { data: clientData } = await callRpcFunction<any>('exec_sql', { 
          sql_query: `SELECT agent_name FROM clients WHERE id = '${client_id}'` 
        });
        
        if (clientData && Array.isArray(clientData) && clientData.length > 0) {
          agent_name = clientData[0].agent_name || 'AI Assistant';
        }
      } catch (error) {
        console.error("Error getting agent name:", error);
        agent_name = 'AI Assistant'; // Fallback
      }
    }

    // Now call the RPC function with both parameters
    const result = await callRpcFunction<number>('get_average_response_time', { 
      client_id_param: client_id,
      agent_name_param: agent_name
    });
    
    return result !== null && result !== undefined ? result : 0; // Return result or default to 0
  } catch (error) {
    console.error("Error getting average response time:", error);
    
    // Fallback: Calculate average response time directly using SQL if the RPC fails
    try {
      const { data } = await callRpcFunction<any>('exec_sql', {
        sql_query: `
          SELECT AVG(response_time_ms)::numeric / 1000 as avg_time
          FROM ai_agents
          WHERE client_id = '${client_id}'
          AND interaction_type = 'chat_interaction'
          AND response_time_ms IS NOT NULL
        `
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        const avgTime = parseFloat(data[0].avg_time);
        return !isNaN(avgTime) ? avgTime : 0;
      }
    } catch (fallbackError) {
      console.error("Fallback error calculation failed:", fallbackError);
    }
    
    return 0;
  }
};
