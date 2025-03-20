
import { supabase } from "@/integrations/supabase/client";
import { InteractionStats, ErrorLog, QueryItem } from "@/types/client-dashboard";
import { execSql, callRpcFunction } from "@/utils/rpcUtils";

/**
 * Get interaction statistics for a client
 * @param clientId The client ID
 * @param agentName The agent name (optional)
 * @returns Interaction statistics
 */
export const getInteractionStats = async (clientId: string, agentName?: string): Promise<InteractionStats> => {
  try {
    // Default empty stats with both snake_case and camelCase properties
    const defaultStats: InteractionStats = {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: [],
      success_rate: 0,
      // Add camelCase properties for compatibility
      totalInteractions: 0,
      activeDays: 0,
      averageResponseTime: 0,
      topQueries: [],
      successRate: 0
    };

    if (!clientId) {
      return defaultStats;
    }

    // Try to fetch stats using an RPC function first
    try {
      const statsData = await callRpcFunction('get_agent_dashboard_stats', {
        client_id_param: clientId,
        agent_name_param: agentName || undefined
      });

      if (statsData) {
        // Create object with both snake_case and camelCase properties
        return {
          total_interactions: statsData.total_interactions || 0,
          active_days: statsData.active_days || 0,
          average_response_time: statsData.average_response_time || 0,
          top_queries: statsData.top_queries || [],
          success_rate: statsData.success_rate || 0,
          // Add camelCase versions for frontend compatibility
          totalInteractions: statsData.total_interactions || 0,
          activeDays: statsData.active_days || 0,
          averageResponseTime: statsData.average_response_time || 0,
          topQueries: statsData.top_queries || [],
          successRate: statsData.success_rate || 0
        };
      }
    } catch (error) {
      console.error("Error fetching stats via RPC:", error);
      // Fall back to individual queries below
    }

    // Fallback: Collect stats using individual queries
    // (This is just a skeleton to show how we would approach this)
    const stats: InteractionStats = {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: [],
      success_rate: 0,
      // Add camelCase versions for frontend compatibility
      totalInteractions: 0,
      activeDays: 0,
      averageResponseTime: 0,
      topQueries: [],
      successRate: 0
    };

    // Run SQL to get total interactions
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM ai_agents 
      WHERE client_id = '${clientId}' 
      AND interaction_type = 'chat_interaction'
    `;
    const totalResult = await execSql(totalQuery);
    if (totalResult && Array.isArray(totalResult) && totalResult.length > 0) {
      if (typeof totalResult[0] === 'object' && totalResult[0] !== null) {
        const count = Number(totalResult[0].count || 0);
        stats.total_interactions = count;
        stats.totalInteractions = count;
      }
    }

    // More queries for other stats...
    
    return stats;
  } catch (error) {
    console.error("Error in getInteractionStats:", error);
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: [],
      success_rate: 0,
      // Add camelCase versions for frontend compatibility
      totalInteractions: 0,
      activeDays: 0,
      averageResponseTime: 0,
      topQueries: [],
      successRate: 0
    };
  }
};

/**
 * Get recent error logs for a client
 * @param clientId The client ID
 * @param limit The number of logs to retrieve
 * @returns Recent error logs
 */
export const getRecentErrorLogs = async (clientId: string, limit: number = 5): Promise<ErrorLog[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('id, error_type, error_message, error_status, query_text, created_at')
      .eq('client_id', clientId)
      .eq('is_error', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent error logs:", error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      error_type: item.error_type || '',
      message: item.error_message || '',
      created_at: item.created_at || '',
      status: item.error_status || '',
      client_id: clientId,
      query_text: item.query_text
    }));
  } catch (error) {
    console.error("Error in getRecentErrorLogs:", error);
    return [];
  }
};

/**
 * Get top queries for a client
 * @param clientId The client ID
 * @param limit The number of queries to retrieve
 * @returns Top queries
 */
export const getTopQueries = async (clientId: string, limit: number = 5): Promise<QueryItem[]> => {
  try {
    // Use RPC for most recent function
    const queries = await callRpcFunction<Array<{query_text: string, frequency: number}>>(
      'get_common_queries', 
      {
        client_id_param: clientId,
        agent_name_param: null,
        limit_param: limit
      }
    );
    
    if (!queries || !Array.isArray(queries)) {
      return [];
    }

    return queries.map(item => ({
      id: `query-${item.query_text.substring(0, 10)}`,
      query_text: item.query_text,
      frequency: item.frequency
    }));
  } catch (error) {
    console.error("Error in getTopQueries:", error);
    return [];
  }
};
