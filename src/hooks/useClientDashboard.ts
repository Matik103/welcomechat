
import { useQuery } from "@tanstack/react-query";
import { getInteractionStats } from "@/services/statsService";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { InteractionStats, ChatInteraction } from "@/types/client-dashboard";
import { toast } from "sonner";

export const useClientDashboard = (clientId: string, defaultAgentName: string = 'AI Assistant') => {
  // Get interaction stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["interaction-stats", clientId],
    queryFn: async () => {
      try {
        if (!clientId) {
          throw new Error("Client ID is required");
        }
        
        const data = await getInteractionStats(clientId);
        
        // Ensure both snake_case and camelCase properties exist
        return {
          // Original snake_case properties
          total_interactions: data.total_interactions || 0,
          active_days: data.active_days || 0,
          average_response_time: data.average_response_time || 0,
          top_queries: data.top_queries || [],
          success_rate: data.success_rate || 100,
          
          // CamelCase properties for frontend compatibility
          totalInteractions: data.total_interactions || 0,
          activeDays: data.active_days || 0,
          averageResponseTime: data.average_response_time || 0,
          topQueries: data.top_queries || [],
          successRate: data.success_rate || 100
        } as InteractionStats;
      } catch (error) {
        console.error("Error fetching interaction stats:", error);
        toast.error("Failed to load performance metrics");
        throw error; // Re-throw to let React Query handle it
      }
    },
    enabled: !!clientId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 60000, // 60 seconds
    refetchOnWindowFocus: false,
  });

  // Get chat history
  const {
    chatHistory,
    isLoading: isLoadingChatHistory,
    error: chatHistoryError,
  } = useClientChatHistory(clientId);

  // Calculate loading and error states
  const isLoading = isLoadingStats || isLoadingChatHistory;
  
  // Expose any errors that occurred
  const error = statsError || chatHistoryError;

  // Return all data for the dashboard
  return {
    stats: stats as InteractionStats || {
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
    },
    chatHistory: chatHistory as ChatInteraction[] || [],
    recentInteractions: chatHistory as ChatInteraction[] || [],
    isLoading,
    error,
    agentName: defaultAgentName
  };
};
