
import { useQuery } from '@tanstack/react-query';
import { fetchChatHistory, fetchRecentInteractions } from '@/services/aiInteractionService';
import { ChatInteraction } from '@/types/agent';
import { execSql } from '@/utils/rpcUtils';

interface DashboardStats {
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: Array<{ query_text: string; frequency: number }>;
}

export const useClientDashboard = (clientId: string, agentName: string) => {
  // Fetch dashboard stats for the client
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', clientId, agentName],
    queryFn: async (): Promise<DashboardStats> => {
      if (!clientId || !agentName) {
        return {
          totalInteractions: 0,
          activeDays: 0,
          averageResponseTime: 0,
          topQueries: []
        };
      }

      try {
        // Using SQL query via RPC since we don't have direct table access
        const query = `
          SELECT 
            COUNT(*) as total_interactions,
            COUNT(DISTINCT DATE(created_at)) as active_days,
            ROUND(AVG(response_time_ms)::numeric / 1000, 2) as average_response_time
          FROM ai_interactions
          WHERE client_id = '${clientId}'
          AND agent_name = '${agentName}'
          AND response_time_ms IS NOT NULL
        `;
        
        const baseStats = await execSql(query);
        
        // Get top queries
        const topQueriesQuery = `
          SELECT query_text, COUNT(*) as frequency
          FROM ai_interactions
          WHERE client_id = '${clientId}'
          AND agent_name = '${agentName}'
          GROUP BY query_text
          ORDER BY frequency DESC
          LIMIT 5
        `;
        
        const topQueriesData = await execSql(topQueriesQuery);
        
        return {
          totalInteractions: parseInt(baseStats[0]?.total_interactions || '0'),
          activeDays: parseInt(baseStats[0]?.active_days || '0'),
          averageResponseTime: parseFloat(baseStats[0]?.average_response_time || '0'),
          topQueries: topQueriesData || []
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          totalInteractions: 0,
          activeDays: 0,
          averageResponseTime: 0,
          topQueries: []
        };
      }
    },
    enabled: !!clientId && !!agentName,
  });

  // Fetch chat history
  const { data: chatHistory = [], isLoading: isLoadingChatHistory } = useQuery({
    queryKey: ['chatHistory', clientId],
    queryFn: () => fetchChatHistory(clientId),
    enabled: !!clientId,
  });

  // Fetch recent interactions
  const { data: recentInteractions = [], isLoading: isLoadingRecentInteractions } = useQuery({
    queryKey: ['recentInteractions', clientId],
    queryFn: () => fetchRecentInteractions(clientId),
    enabled: !!clientId,
  });

  const isLoading = isLoadingStats || isLoadingChatHistory || isLoadingRecentInteractions;

  return {
    agentName,
    stats,
    chatHistory,
    recentInteractions,
    isLoading
  };
};
