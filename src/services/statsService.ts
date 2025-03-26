
import { getInteractionCount } from "./interactionCountService";
import { getActiveDays } from "./activeDaysService";
import { getAverageResponseTime } from "./responseTimeService";
import { fetchTopQueries } from "./topQueriesService";

// Export the getInteractionStats function that was missing
export const getInteractionStats = async (clientId?: string, agentName: string = 'AI Assistant') => {
  try {
    // Fetch all stats in parallel
    const [totalInteractions, activeDays, averageResponseTime, topQueries] = await Promise.all([
      getInteractionCount('all', clientId),
      getActiveDays('all', clientId),
      getAverageResponseTime('all', clientId),
      fetchTopQueries(clientId, 5)
    ]);

    return {
      total_interactions: totalInteractions,
      active_days: activeDays,
      average_response_time: averageResponseTime,
      top_queries: topQueries || [],
      success_rate: 100, // Default if not calculated
      
      // CamelCase variants for frontend compatibility
      totalInteractions,
      activeDays,
      averageResponseTime,
      topQueries: topQueries || [],
      successRate: 100
    };
  } catch (error) {
    console.error("Error in getClientStats:", error);
    throw error;
  }
};

// Function to get client stats
export const getClientStats = async (clientId?: string, timeRange: string = '1m') => {
  try {
    // Fetch all stats in parallel
    const [activeDays, interactionCount, avgResponseTime, commonQueries] = await Promise.all([
      getActiveDays(timeRange as any, clientId),
      getInteractionCount(timeRange as any, clientId),
      getAverageResponseTime(timeRange as any, clientId),
      fetchTopQueries(clientId, 5)
    ]);

    return {
      activeDays,
      interactionCount,
      avgResponseTime,
      commonQueries: commonQueries.map(q => ({
        query: q.query_text,
        count: q.frequency
      }))
    };
  } catch (error) {
    console.error("Error in getClientStats:", error);
    throw error;
  }
};
