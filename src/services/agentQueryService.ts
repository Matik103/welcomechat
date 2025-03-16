
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
 * Get all AI agents for a specific client
 * This is useful for n8n when selecting which agent to query
 */
export const getAgentsByClientId = async (
  clientId: string,
  limit: number = 100
) => {
  try {
    console.log(`Querying all agent data for client: ${clientId}`);
    
    // Use the specialized function for all client agents
    const { data, error } = await supabase.rpc(
      'match_agent_client' as any, 
      { 
        client_id_param: clientId,
        limit_param: limit
      }
    );

    if (error) {
      console.error("Error querying client agents:", error);
      throw error;
    }

    console.log(`Successfully retrieved ${data?.length || 0} agent records for client`);
    return data || [];
    
  } catch (err) {
    console.error("Failed to execute client agents query:", err);
    throw err;
  }
};

/**
 * Get distinct agent names for a specific client
 * This is useful for n8n when selecting which agent to query
 */
export const getAgentNamesByClientId = async (
  clientId: string
) => {
  try {
    console.log(`Querying agent names for client: ${clientId}`);
    
    // Use the specialized function for agent names
    const { data, error } = await supabase.rpc(
      'get_client_agent_names' as any,
      { 
        client_id_param: clientId
      }
    );

    if (error) {
      console.error("Error querying agent names:", error);
      throw error;
    }

    console.log(`Successfully retrieved ${data?.length || 0} agent names`);
    return data || [];
    
  } catch (err) {
    console.error("Failed to execute agent names query:", err);
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

-- Alternatively, query all agents for a client:
-- SELECT * FROM match_agent_client(
--   '${clientId}'::uuid, -- client_id
--   ${limit}             -- limit
-- );

-- Get just the agent names for a client:
-- SELECT * FROM get_client_agent_names(
--   '${clientId}'::uuid  -- client_id
-- );
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
