
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/client-dashboard";

export const useClientChatData = (clientId: string) => {
  // Fetch client chat data
  return useQuery({
    queryKey: ["client-chat-data", clientId],
    queryFn: async () => {
      if (!clientId) {
        return {
          chatInteractions: [],
          error: null,
        };
      }
      try {
        // Query chat interactions for this client
        const { data, error } = await supabase
          .from("ai_agents")
          .select("id, query_text, content, created_at, name, response_time_ms")
          .eq("client_id", clientId)
          .eq("interaction_type", "chat_interaction")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data to match ChatInteraction type
        const chatInteractions: ChatInteraction[] = data.map((item) => ({
          id: item.id,
          query_text: item.query_text || "",
          response_text: item.content || "", // Use content as response_text
          created_at: item.created_at || "",
          agent_name: item.name || "AI Assistant",
          client_id: clientId,
          response_time_ms: item.response_time_ms
        }));

        return {
          chatInteractions,
          error: null,
        };
      } catch (error) {
        console.error("Error fetching client chat data:", error);
        return {
          chatInteractions: [],
          error,
        };
      }
    },
    enabled: !!clientId,
  });
};
