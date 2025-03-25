
import { fetchTopQueries } from './topQueriesService';
import { getInteractionCount } from './interactionCountService';
import { getActiveDays } from './activeDaysService';
import { getAverageResponseTime } from './responseTimeService';
import { InteractionStats } from '@/types/client-dashboard';
import { supabase } from '@/integrations/supabase/client';

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

export const getInteractionStats = async (clientId: string, agentName?: string, timeRange?: string): Promise<InteractionStats> => {
  try {
    const daysToLookBack = timeRange === '1d' ? 1 : 
                          timeRange === '1m' ? 30 : 
                          timeRange === '1y' ? 365 : null;
    
    // Get client-specific stats
    const [interactions, activeDays, responseTime, topQueries] = await Promise.all([
      getInteractionCount(clientId, agentName),
      getActiveDays(clientId, agentName),
      getAverageResponseTime(clientId, agentName),
      fetchTopQueries(clientId, 5)
    ]);
    
    // Get global stats for admin dashboard
    let totalClients = 0;
    let activeClients = 0;
    let activeClientsChange = "0";

    // Only fetch these if clientId is undefined or empty (admin dashboard)
    if (!clientId) {
      // Count total clients
      const { count: totalCount, error: totalError } = await supabase
        .from('ai_agents')
        .select('client_id', { count: 'exact', head: true })
        .neq('client_id', null)
        .is('deleted_at', null);
      
      if (!totalError && totalCount !== null) {
        totalClients = totalCount;
      }
      
      // Count active clients (had activity in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeCount, error: activeError } = await supabase
        .from('ai_agents')
        .select('client_id', { count: 'exact', head: true })
        .neq('client_id', null)
        .is('deleted_at', null)
        .gt('created_at', thirtyDaysAgo.toISOString());
      
      if (!activeError && activeCount !== null) {
        activeClients = activeCount;
        // Calculate change percentage (mocked for now)
        activeClientsChange = Math.round((activeCount / Math.max(1, totalClients)) * 100).toString();
      }
    }
    
    return {
      total_interactions: interactions,
      active_days: activeDays,
      average_response_time: responseTime,
      top_queries: topQueries,
      success_rate: 100,
      totalInteractions: interactions,
      activeDays: activeDays,
      averageResponseTime: responseTime,
      topQueries: topQueries,
      successRate: 100,
      avgInteractions: interactions / Math.max(1, activeDays),
      avgInteractionsChange: "12",  // Mocked change percentage
      totalClients,
      activeClients,
      activeClientsChange
    };
  } catch (error) {
    console.error('Error getting interaction stats:', error);
    
    // Return fallback values on error
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
      successRate: 100,
      avgInteractions: 0,
      avgInteractionsChange: "0",
      totalClients: 0,
      activeClients: 0,
      activeClientsChange: "0"
    };
  }
};
