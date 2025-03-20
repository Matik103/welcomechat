
import { useQuery } from "@tanstack/react-query";
import { getInteractionStats } from "@/services/statsService";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { InteractionStats, ChatInteraction } from "@/types/client-dashboard";

export const useClientDashboard = (clientId: string, agentName?: string) => {
  // Get interaction stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["interaction-stats", clientId, agentName],
    queryFn: async () => {
      const data = await getInteractionStats(clientId, agentName);
      
      // Ensure both snake_case and camelCase properties exist
      return {
        // Original snake_case properties
        total_interactions: data.total_interactions,
        active_days: data.active_days,
        average_response_time: data.average_response_time,
        top_queries: data.top_queries,
        success_rate: data.success_rate,
        
        // CamelCase properties for frontend compatibility
        totalInteractions: data.total_interactions,
        activeDays: data.active_days,
        averageResponseTime: data.average_response_time,
        topQueries: data.top_queries,
        successRate: data.success_rate
      } as InteractionStats;
    },
    enabled: !!clientId,
  });

  // Get chat history
  const {
    chatHistory,
    isLoading: isLoadingChatHistory,
    error: chatHistoryError,
  } = useClientChatHistory(clientId, agentName);

  // Calculate loading and error states
  const isLoading = isLoadingStats || isLoadingChatHistory;
  const error = statsError || chatHistoryError || null;

  // Return all data for the dashboard
  return {
    stats: stats as InteractionStats,
    chatHistory: chatHistory as ChatInteraction[],
    recentInteractions: chatHistory as ChatInteraction[],
    isLoading,
    error,
    agentName
  };
};
