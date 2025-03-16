
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
    
    // Query directly from the ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('name', agentName)
      .order('created_at', { ascending: false })
      .limit(limit);

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
    
    // Get distinct agent names first
    const { data: agentNames, error: namesError } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('client_id', clientId)
      .order('name')
      .distinct();

    if (namesError) {
      console.error("Error querying client agents:", namesError);
      throw namesError;
    }

    // For each agent name, get the most recent record
    const agentRecords = [];
    for (const { name } of agentNames || []) {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('name', name)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (!error && data && data.length > 0) {
        agentRecords.push(data[0]);
      }
    }

    console.log(`Successfully retrieved ${agentRecords.length} agent records for client`);
    return agentRecords;
    
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
    
    const { data, error } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('client_id', clientId)
      .order('name')
      .distinct();

    if (error) {
      console.error("Error querying agent names:", error);
      throw error;
    }

    console.log(`Successfully retrieved ${data?.length || 0} agent names`);
    return data?.map(record => record.name) || [];
    
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
-- Use this query in your n8n PostgreSQL node to get data for a specific AI agent
SELECT * FROM ai_agents
WHERE client_id = '${clientId}'::uuid
  AND name = '${agentName}'
ORDER BY created_at DESC
LIMIT ${limit};

-- To get distinct agent names for a client:
-- SELECT DISTINCT name FROM ai_agents
-- WHERE client_id = '${clientId}'::uuid
-- ORDER BY name;
  `.trim();
};

/**
 * Get dashboard statistics for a specific agent
 * This function uses the database function that queries ai_agents table
 */
export const getAgentDashboardStats = async (
  clientId: string,
  agentName: string
) => {
  try {
    console.log(`Fetching dashboard stats for client: ${clientId}, agent: ${agentName}`);
    
    // Use the database function for the stats
    const { data, error } = await supabase.rpc(
      'get_agent_dashboard_stats',
      { 
        client_id_param: clientId,
        agent_name_param: agentName
      }
    );

    if (error) {
      console.error("Error retrieving agent stats:", error);
      throw error;
    }

    console.log("Agent stats result:", data);
    return data;
    
  } catch (err) {
    console.error("Failed to get agent dashboard stats:", err);
    throw err;
  }
};
