
import { supabase } from "@/integrations/supabase/client";
import { getTopQueries } from "./topQueriesService";
import { getInteractionsByDay } from "./interactionCountService";
import { getActiveDays, ActiveDay } from "./activeDaysService";
import { getAverageResponseTime, getAverageResponseTimeByDay } from "./responseTimeService";
import { InteractionStats, QueryItem } from "@/types/client-dashboard";
import { callRpcFunction, execSql } from "@/utils/rpcUtils";

// Define missing interfaces
interface TopClient {
  client_id: string;
  client_name: string;
  interaction_count: number;
}

interface InteractionTrend {
  day: string;
  count: number;
}

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
        const { data: agentData } = await callRpcFunction('exec_sql', { 
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
    const result = await callRpcFunction('get_agent_dashboard_stats', { 
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
    let activeDays: number = 0;
    let averageResponseTime = 0;
    let topQueries: QueryItem[] = [];
    
    try {
      const interactionsData = await getInteractionsByDay(clientId);
      totalInteractions = interactionsData.reduce((sum, item) => sum + item.count, 0);
    } catch (error) {
      console.error("Error getting total interactions:", error);
    }
    
    try {
      const activeDaysData = await getActiveDays(clientId);
      activeDays = activeDaysData.length;
    } catch (error) {
      console.error("Error getting active days:", error);
    }
    
    try {
      averageResponseTime = await getAverageResponseTime(clientId, agentName);
    } catch (error) {
      console.error("Error getting average response time:", error);
    }
    
    try {
      topQueries = await getTopQueries(clientId, agentName || "AI Assistant");
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

export const getTopInteractingClients = async (limit: number = 5, days: number = 30): Promise<TopClient[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT 
        a.client_id,
        c.name AS client_name,
        COUNT(*) AS interaction_count
      FROM client_activities a
      LEFT JOIN ai_agents c ON a.client_id = c.client_id
      WHERE 
        a.activity_type = 'chat_interaction'
        AND a.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND c.interaction_type = 'config'
      GROUP BY a.client_id, c.name
      ORDER BY interaction_count DESC
      LIMIT ${limit}
      `
    );
    
    // Convert to fully-typed TopClient
    return result.map(item => ({
      client_id: item.client_id,
      client_name: item.client_name,
      interaction_count: item.interaction_count
    }));
  } catch (error) {
    console.error("Error getting top interacting clients:", error);
    return [];
  }
};

export const getInteractionTrends = async (days: number = 30): Promise<InteractionTrend[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT 
        date_trunc('day', created_at) AS day,
        COUNT(*) AS count
      FROM client_activities
      WHERE 
        activity_type = 'chat_interaction'
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY day
      `
    );
    
    // Convert to fully-typed InteractionTrend
    return result.map(item => ({
      day: item.day,
      count: item.count
    }));
  } catch (error) {
    console.error("Error getting interaction trends:", error);
    return [];
  }
};
