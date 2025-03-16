
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

/**
 * Hook to fetch chat history for a specific client's AI agent
 */
export const useClientChatHistory = (agentName?: string) => {
  return useQuery({
    queryKey: ["chatHistory", agentName],
    queryFn: async () => {
      if (!agentName) return [];
      
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, content, query_text, created_at, settings")
        .eq("name", agentName)
        .eq("interaction_type", "chat_interaction")
        .eq("is_error", false)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Transform to match the ChatInteraction interface
      return (data || []).map(item => ({
        id: item.id,
        content: item.content || "",
        metadata: {
          user_message: item.query_text || "",
          timestamp: item.created_at,
          // Safely handle settings - ensure it's an object before trying to spread
          ...(item.settings && typeof item.settings === 'object' ? item.settings : {})
        }
      })) as ChatInteraction[];
    },
    enabled: !!agentName,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
