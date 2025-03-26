
import { getActiveDays } from './activeDaysService';
import { getInteractionCount } from './interactionCountService';
import { getAverageResponseTime } from './responseTimeService';
import { getTopQueries } from './topQueriesService';

export interface StatsData {
  activeDays: number;
  interactionCount: number;
  avgResponseTime: number;
  commonQueries: { query: string; count: number }[];
}

/**
 * Get client stats for a specific client
 */
export const getClientStats = async (
  clientId?: string,
  timeRange: "1d" | "1m" | "1y" | "all" = "1m"
): Promise<StatsData> => {
  try {
    // Fetch all stats in parallel for efficiency
    const [activeDays, interactionCount, avgResponseTime, commonQueries] = await Promise.all([
      getActiveDays(timeRange, clientId),
      getInteractionCount(timeRange, clientId),
      getAverageResponseTime(timeRange, clientId),
      getTopQueries(clientId, 5)
    ]);
    
    return {
      activeDays,
      interactionCount,
      avgResponseTime,
      commonQueries
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    throw error;
  }
};

/**
 * Get dashboard stats for all clients
 */
export const getDashboardStats = async (
  timeRange: "1d" | "1m" | "1y" | "all" = "1m"
): Promise<StatsData> => {
  try {
    // Fetch all stats in parallel for efficiency
    const [activeDays, interactionCount, avgResponseTime, commonQueries] = await Promise.all([
      getActiveDays(timeRange),
      getInteractionCount(timeRange),
      getAverageResponseTime(timeRange),
      getTopQueries(undefined, 5)
    ]);
    
    return {
      activeDays,
      interactionCount,
      avgResponseTime,
      commonQueries
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
