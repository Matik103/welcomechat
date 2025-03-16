
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
 * This function can use either direct database function or edge function API
 */
export const getAgentDashboardStats = async (
  clientId: string,
  agentName: string
) => {
  try {
    console.log(`Fetching dashboard stats for client: ${clientId}, agent: ${agentName}`);
    
    // Try using the Edge Function first as it's more reliable across environments
    try {
      // Use Supabase's built-in function invoker instead of direct fetch
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'get_agent_dashboard_stats',
        {
          body: { client_id: clientId, agent_name: agentName }
        }
      );
      
      if (!edgeFunctionError && edgeFunctionData) {
        console.log("Edge function stats:", edgeFunctionData);
        return edgeFunctionData.data;
      } else {
        console.warn("Edge function failed, falling back to RPC:", edgeFunctionError);
      }
    } catch (edgeFnError) {
      console.warn("Edge function error, falling back to RPC:", edgeFnError);
    }
    
    // Fallback to direct RPC if edge function fails
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

    console.log("RPC stats result:", data);
    return data;
    
  } catch (err) {
    console.error("Failed to get agent dashboard stats:", err);
    throw err;
  }
};
