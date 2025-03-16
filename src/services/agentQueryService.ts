
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
    
    // First get all unique agent names
    const { data: namesData, error: namesError } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('client_id', clientId)
      .order('name');

    if (namesError) {
      console.error("Error querying client agents:", namesError);
      throw namesError;
    }
    
    // Extract unique agent names
    const uniqueNames = Array.from(new Set(namesData?.map(item => item.name) || []));
    console.log(`Found ${uniqueNames.length} unique agent names`);

    // For each agent name, get the most recent record
    const agentRecords = [];
    for (const name of uniqueNames) {
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
      .eq('client_id', clientId);

    if (error) {
      console.error("Error querying agent names:", error);
      throw error;
    }
    
    // Extract unique agent names
    const uniqueNames = Array.from(new Set(data?.map(record => record.name) || []));
    console.log(`Successfully retrieved ${uniqueNames.length} unique agent names`);
    return uniqueNames;
    
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
    
    // First, check if the get_agent_dashboard_stats function exists
    const { data: funcExistsData, error: funcError } = await supabase.rpc(
      'exec_sql',
      {
        sql_query: `
          SELECT EXISTS (
            SELECT 1 
            FROM pg_proc 
            WHERE proname = 'get_agent_dashboard_stats'
          ) as exists
        `
      }
    );
    
    // Safely check if the function exists
    const funcExists = Array.isArray(funcExistsData) && 
                      funcExistsData.length > 0 && 
                      typeof funcExistsData[0] === 'object' && 
                      funcExistsData[0] !== null &&
                      'exists' in funcExistsData[0] && 
                      funcExistsData[0].exists === true;
    
    // If the function exists, use it
    if (funcExists) {
      // Use the database function for the stats
      const { data, error } = await supabase.rpc(
        'get_agent_dashboard_stats',
        { 
          client_id_param: clientId,
          agent_name_param: agentName
        }
      );

      if (error) {
        console.error("Error retrieving agent stats using function:", error);
        throw error;
      }

      console.log("Agent stats result from function:", data);
      return data;
    } else {
      // If function doesn't exist, query directly from ai_agents table
      console.log("get_agent_dashboard_stats function not found, querying directly");
      
      // Get total interactions
      const { data: totalInteractions, error: countError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('name', agentName)
        .eq('interaction_type', 'chat_interaction');
        
      if (countError) {
        console.error("Error counting interactions:", countError);
        throw countError;
      }
      
      // Get active days
      const { data: activeDaysData, error: daysError } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT COUNT(DISTINCT DATE(created_at)) as active_days
            FROM ai_agents
            WHERE client_id = '${clientId}'
              AND name = '${agentName}'
              AND interaction_type = 'chat_interaction'
          `
        }
      );
      
      if (daysError) {
        console.error("Error calculating active days:", daysError);
        throw daysError;
      }
      
      // Get average response time
      const { data: avgResponseData, error: avgError } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT COALESCE(AVG(response_time_ms)::numeric / 1000, 0) as avg_response_time
            FROM ai_agents
            WHERE client_id = '${clientId}'
              AND name = '${agentName}'
              AND interaction_type = 'chat_interaction'
              AND response_time_ms IS NOT NULL
          `
        }
      );
      
      if (avgError) {
        console.error("Error calculating average response time:", avgError);
        throw avgError;
      }
      
      // Get top queries
      const { data: topQueriesData, error: topQueriesError } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT query_text, COUNT(*) as frequency
            FROM ai_agents
            WHERE client_id = '${clientId}'
              AND name = '${agentName}'
              AND interaction_type = 'chat_interaction'
              AND query_text IS NOT NULL
            GROUP BY query_text
            ORDER BY frequency DESC
            LIMIT 5
          `
        }
      );
      
      if (topQueriesError) {
        console.error("Error fetching top queries:", topQueriesError);
        throw topQueriesError;
      }
      
      // Parse active days value safely
      const activeDays = Array.isArray(activeDaysData) && 
                        activeDaysData.length > 0 && 
                        typeof activeDaysData[0] === 'object' &&
                        activeDaysData[0] !== null &&
                        'active_days' in activeDaysData[0] ? 
                        Number(activeDaysData[0].active_days) : 0;
      
      // Parse average response time safely
      const avgResponseTime = Array.isArray(avgResponseData) && 
                            avgResponseData.length > 0 && 
                            typeof avgResponseData[0] === 'object' &&
                            avgResponseData[0] !== null &&
                            'avg_response_time' in avgResponseData[0] ? 
                            Number(avgResponseData[0].avg_response_time) : 0;
      
      // Construct the stats object
      const stats = {
        total_interactions: totalInteractions?.length || 0,
        active_days: activeDays,
        average_response_time: avgResponseTime,
        top_queries: topQueriesData || []
      };
      
      console.log("Agent stats result from direct query:", stats);
      return stats;
    }
  } catch (err) {
    console.error("Failed to get agent dashboard stats:", err);
    throw err;
  }
};

/**
 * Direct query to get all AI agent data for a client, used for debugging
 */
export const debugGetAllAgentData = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error in debug query:", err);
    throw err;
  }
};
