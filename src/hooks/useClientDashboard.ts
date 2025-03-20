
import { useQuery } from '@tanstack/react-query';
import { callRpcFunction } from '@/utils/rpcUtils';
import { InteractionStats } from '@/types/client-dashboard';
import { ChatInteraction } from '@/types/extended-supabase';

/**
 * Hook to fetch dashboard statistics for a client
 */
export const useClientDashboard = (clientId: string, agentName?: string) => {
  // Fetch dashboard stats
  const { data: statsData, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', clientId, agentName],
    queryFn: async () => {
      try {
        if (!clientId) return null;
        
        let stats: InteractionStats;
        
        if (agentName) {
          // Get agent-specific stats if agentName is provided
          const data = await callRpcFunction<any>('get_agent_dashboard_stats', {
            client_id_param: clientId,
            agent_name_param: agentName
          });
          
          // Transform to provide both snake_case and camelCase properties for compatibility
          stats = {
            total_interactions: data.total_interactions,
            active_days: data.active_days,
            average_response_time: data.average_response_time,
            top_queries: data.top_queries || [],
            successRate: data.success_rate,
            // Add camelCase aliases
            totalInteractions: data.total_interactions,
            activeDays: data.active_days,
            averageResponseTime: data.average_response_time,
            topQueries: data.top_queries || []
          };
        } else {
          // Get client-level stats if no agentName is provided
          const data = await callRpcFunction<any>('get_client_dashboard_stats', {
            client_id_param: clientId
          });
          
          // Transform to provide both snake_case and camelCase properties for compatibility
          stats = {
            total_interactions: data.total_interactions,
            active_days: data.active_days,
            average_response_time: data.average_response_time,
            top_queries: data.top_queries || [],
            successRate: data.success_rate,
            // Add camelCase aliases
            totalInteractions: data.total_interactions,
            activeDays: data.active_days,
            averageResponseTime: data.average_response_time,
            topQueries: data.top_queries || []
          };
        }
        
        return stats;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
      }
    },
    enabled: !!clientId
  });

  // Fetch recent chat interactions
  const { data: chatData, isLoading: isChatLoading } = useQuery({
    queryKey: ['chat-history', clientId, agentName],
    queryFn: async () => {
      try {
        if (!clientId) return [];
        
        // Get interactions
        const interactions = await callRpcFunction<any[]>('get_ai_interactions', {
          client_id_param: clientId,
          agent_name_param: agentName || null,
          limit_param: 10
        });
        
        return interactions.map(interaction => ({
          id: interaction.id,
          clientId: interaction.client_id,
          timestamp: interaction.created_at,
          query: interaction.query_text,
          response: interaction.response_text || 'No response',
          agentName: interaction.agent_name,
          responseTimeMs: interaction.response_time_ms
        })) as ChatInteraction[];
      } catch (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }
    },
    enabled: !!clientId
  });

  return {
    stats: statsData || null,
    chatHistory: chatData || [],
    recentInteractions: chatData?.slice(0, 5) || [],
    isLoading: isStatsLoading || isChatLoading,
    error: statsError
  };
};
