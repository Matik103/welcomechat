
import { fetchTopQueries } from './topQueriesService';
import { getInteractionCount } from './interactionCountService';
import { getActiveDays } from './activeDaysService';
import { getAverageResponseTime } from './responseTimeService';

export const getClientStats = async (clientId: string, agentName?: string) => {
  try {
    const [interactions, activeDays, responseTime, topQueries] = await Promise.all([
      getInteractionCount(clientId, agentName),
      getActiveDays(clientId, agentName),
      getAverageResponseTime(clientId, agentName),
      fetchTopQueries(clientId, 5)
    ]);

    return {
      totalInteractions: interactions,
      activeDays,
      averageResponseTime: responseTime,
      topQueries
    };
  } catch (error) {
    console.error('Error getting client stats:', error);
    throw error;
  }
};

// Add the missing function
export const getInteractionStats = async (clientId: string, timeRange?: string) => {
  try {
    const daysToLookBack = timeRange === '1d' ? 1 : 
                          timeRange === '1m' ? 30 : 
                          timeRange === '1y' ? 365 : null;
    
    // Implement a simple mock for now to fix the build error
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
  } catch (error) {
    console.error('Error getting interaction stats:', error);
    throw error;
  }
};
