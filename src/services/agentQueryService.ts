
import { supabase } from "@/integrations/supabase/client";

/**
 * Service to query AI agent data by combining client ID and agent name for specific lookups
 * This ensures that n8n workflows can get the exact chatbot data from the ai_agents table
 */
export const getAgentDataByClientAndName = async (
  clientId: string,
  agentName: string,
  limit: number = 100
) => {
  try {
    console.log(`Querying agent data for client: ${clientId}, agent: ${agentName}`);
    
    // Use the specialized function for precise querying
    const { data, error } = await supabase.rpc(
      'match_client_agent_data' as any, // Type assertion needed until DB types are updated
      { 
        client_id_param: clientId,
        agent_name_param: agentName,
        limit_param: limit
      }
    );

    if (error) {
      console.error("Error querying agent data:", error);
      throw error;
    }

    console.log(`Successfully retrieved ${data?.length || 0} agent records`);
    return data || [];
    
  } catch (err) {
    console.error("Failed to execute agent data query:", err);
    throw err;
  }
};

/**
 * Helper to generate the exact SQL query for n8n to use directly
 * This creates an SQL template that can be copied into n8n PostgreSQL nodes
 */
export const generateAgentQueryForN8n = (
  clientId: string,
  agentName: string,
  limit: number = 100
) => {
  return `
-- Use this query in your n8n PostgreSQL node to get exact data for a specific chatbot
SELECT * FROM match_client_agent_data(
  '${clientId}'::uuid, -- client_id (replace with your actual client UUID)
  '${agentName}',      -- agent_name
  ${limit}             -- limit
);

-- Alternatively, you can use this direct query if you prefer:
-- SELECT *
-- FROM ai_agents
-- WHERE client_id = '${clientId}'::uuid AND name = '${agentName}'
-- ORDER BY created_at DESC
-- LIMIT ${limit};
  `.trim();
};

/**
 * Get dashboard statistics for a specific agent
 */
export const getAgentDashboardStats = async (
  clientId: string,
  agentName: string
) => {
  try {
    const { data, error } = await supabase.rpc(
      'get_agent_dashboard_stats' as any, // Type assertion needed until DB types are updated
      { 
        client_id_param: clientId,
        agent_name_param: agentName
      }
    );

    if (error) {
      console.error("Error retrieving agent stats:", error);
      throw error;
    }

    return data;
    
  } catch (err) {
    console.error("Failed to get agent dashboard stats:", err);
    throw err;
  }
};
