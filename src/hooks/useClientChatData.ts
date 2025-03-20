
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/extended-supabase";
import { fetchRecentInteractions } from "@/services/aiInteractionService";

export const useClientChatData = (clientId: string) => {
  // Get chat history
  const {
    data: chatHistory,
    isLoading: isLoadingChatHistory,
    error: chatHistoryError,
    refetch: refetchChatHistory
  } = useQuery({
    queryKey: ["chatHistory", clientId],
    queryFn: async (): Promise<ChatInteraction[]> => {
      try {
        // Query AI interactions with type 'chat_interaction'
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        // Map response to ChatInteraction format
        return (data || []).map(interaction => ({
          id: String(interaction.id),
          clientId: String(interaction.client_id),
          timestamp: String(interaction.created_at),
          query: String(interaction.query_text || ''),
          response: String(interaction.content || ''),
          agentName: String(interaction.name || 'AI Assistant'),
          responseTimeMs: Number(interaction.response_time_ms || 0),
          metadata: interaction.metadata || {}
        }));
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }
    },
    enabled: !!clientId
  });

  // Get recent interactions (most recent few)
  const {
    data: recentInteractions,
    isLoading: isLoadingRecentInteractions,
    error: recentInteractionsError,
    refetch: refetchRecentInteractions
  } = useQuery({
    queryKey: ["recentInteractions", clientId],
    queryFn: () => fetchRecentInteractions(clientId, 5),
    enabled: !!clientId
  });

  // Function to get chat sessions (grouped chats) - fake implementation for now
  const getChatSessions = async () => {
    // This is just a placeholder until a real implementation is needed
    return chatHistory || [];
  };

  // For now, reuse the recent interactions as an alias
  const getRecentInteractions = async (limit = 5) => {
    return recentInteractions?.slice(0, limit) || [];
  };

  return {
    chatHistory: chatHistory || [],
    recentInteractions: recentInteractions || [],
    isLoading: isLoadingChatHistory || isLoadingRecentInteractions,
    error: chatHistoryError || recentInteractionsError,
    refetchChatHistory,
    refetchRecentInteractions,
    getChatSessions,
    getRecentInteractions
  };
};
