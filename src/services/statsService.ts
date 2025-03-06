
import { InteractionStats } from "@/types/client-dashboard";
import { fetchTotalInteractions } from "./interactionCountService";
import { fetchActiveDays } from "./activeDaysService";
import { fetchAverageResponseTime } from "./responseTimeService";
import { fetchTopQueries } from "./topQueriesService";
import { subscribeToActivities } from "./activitySubscriptionService";

/**
 * Fetches dashboard statistics for a specific client
 */
export const fetchDashboardStats = async (clientId: string): Promise<InteractionStats> => {
  if (!clientId) {
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }

  try {
    // Fetch all stats in parallel
    const [
      totalInteractions,
      activeDays,
      avgResponseTime,
      topQueriesList
    ] = await Promise.all([
      fetchTotalInteractions(clientId),
      fetchActiveDays(clientId),
      fetchAverageResponseTime(clientId),
      fetchTopQueries(clientId)
    ]);

    // Return the combined stats
    return {
      total_interactions: totalInteractions,
      active_days: activeDays,
      average_response_time: avgResponseTime,
      top_queries: topQueriesList
    };
    
  } catch (err) {
    console.error("Error fetching stats:", err);
    // Return default values in case of error
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }
};

// Re-export activity subscription service
export { subscribeToActivities };
