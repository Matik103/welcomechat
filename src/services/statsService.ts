
import { supabase } from "@/integrations/supabase/client";
import { fetchTopQueries } from "./topQueriesService";
import { getInteractionCount } from "./interactionCountService";
import { getActiveDays } from "./activeDaysService";
import { getAverageResponseTime } from "./responseTimeService";
import { InteractionStats } from "@/types/client-dashboard";
import { QueryItem } from "@/types/client-dashboard";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Gets all interaction stats for a client
 * @param clientId The client ID
 * @param agentName Optional agent name
 * @returns All interaction stats
 */
export const getInteractionStats = async (clientId: string, agentName?: string): Promise<InteractionStats> => {
  try {
    // Get agent name if not provided
    if (!agentName) {
      try {
        const { data: agentData } = await callRpcFunction<any>('exec_sql', { 
          sql_query: `SELECT name FROM ai_agents WHERE client_id = '${clientId}' LIMIT 1` 
        });
        
        if (agentData && Array.isArray(agentData) && agentData.length > 0) {
          agentName = agentData[0].name || 'AI Assistant';
        } else {
          agentName = 'AI Assistant'; // Default value
        }
      } catch (error) {
        console.error("Error getting agent name:", error);
        agentName = 'AI Assistant'; // Fallback
      }
    }

    // Use RPC function to get all stats at once - use get_agent_dashboard_stats (not get_client_dashboard_stats)
    const result = await callRpcFunction<{
      total_interactions: number;
      active_days: number;
      average_response_time: number;
      top_queries?: Array<{query_text: string, frequency: number}>;
      success_rate?: number;
    }>('get_agent_dashboard_stats', { 
      client_id_param: clientId,
      agent_name_param: agentName 
    });

    // If the RPC function returns data, use it
    if (result && typeof result === 'object') {
      // Extract top queries from result or fallback to empty array
      const topQueries = Array.isArray(result.top_queries) 
        ? result.top_queries.map(q => ({
            id: `query-${q.query_text?.substring(0, 10) || Math.random().toString(36).substring(2, 12)}`,
            query_text: q.query_text || "Unknown query",
            frequency: q.frequency || 1
          }))
        : [];

      // Convert to fully-typed InteractionStats
      return {
        total_interactions: result.total_interactions || 0,
        active_days: result.active_days || 0,
        average_response_time: result.average_response_time || 0,
        top_queries: topQueries,
        success_rate: result.success_rate || 100,
        
        // Add camelCase versions for frontend compatibility
        totalInteractions: result.total_interactions || 0,
        activeDays: result.active_days || 0,
        averageResponseTime: result.average_response_time || 0,
        topQueries: topQueries,
        successRate: result.success_rate || 100
      };
    }

    // Fallback to individual calls if the RPC function fails or returns unexpected data
    console.warn("RPC function returned unexpected data, using fallback methods");
    return getFallbackStats(clientId, agentName);
  } catch (error) {
    console.error("Error getting stats from RPC:", error);
    // Fallback to individual API calls
    return getFallbackStats(clientId, agentName);
  }
};

/**
 * Fallback method to get stats if the RPC function fails
 */
const getFallbackStats = async (clientId: string, agentName?: string): Promise<InteractionStats> => {
  try {
    // Make individual calls to get the stats
    let totalInteractions = 0;
    let activeDays = 0;
    let averageResponseTime = 0;
    let topQueries: QueryItem[] = [];
    
    try {
      totalInteractions = await getInteractionCount(clientId, agentName);
    } catch (error) {
      console.error("Error getting total interactions:", error);
    }
    
    try {
      activeDays = await getActiveDays(clientId, agentName);
    } catch (error) {
      console.error("Error getting active days:", error);
    }
    
    try {
      averageResponseTime = await getAverageResponseTime(clientId, agentName);
    } catch (error) {
      console.error("Error getting average response time:", error);
    }
    
    try {
      topQueries = await fetchTopQueries(clientId, agentName);
    } catch (error) {
      console.error("Error getting top queries:", error);
    }

    // Calculate success rate - hardcoded for now
    const successRate = 98;

    return {
      total_interactions: totalInteractions,
      active_days: activeDays,
      average_response_time: averageResponseTime,
      top_queries: topQueries,
      success_rate: successRate,
      
      // Add camelCase versions for frontend compatibility
      totalInteractions,
      activeDays, 
      averageResponseTime,
      topQueries,
      successRate
    };
  } catch (error) {
    console.error("Error getting fallback stats:", error);
    
    // Return default values if all else fails
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: [],
      success_rate: 100,
      
      totalInteractions: 0,
      activeDays: 0,
      averageResponseTime: 0,
      topQueries: [],
      successRate: 100
    };
  }
};

/**
 * Gets recent queries for a client
 * @param clientId The client ID
 * @param limit Max number of queries to return
 * @returns Recent queries
 */
export const getRecentQueries = async (clientId: string, limit = 5): Promise<QueryItem[]> => {
  try {
    // Query recent interactions
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, query_text, created_at")
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Convert to QueryItem format
    return data.map(item => ({
      id: item.id,
      query_text: item.query_text || '',
      frequency: 1, // Individual queries have frequency of 1
      created_at: item.created_at,
      client_id: clientId
    }));
  } catch (error) {
    console.error("Error fetching recent queries:", error);
    return [];
  }
};
