
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
