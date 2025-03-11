
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

export const useClientChatHistory = (agentName: string | undefined, clientId: string | undefined) => {
  return useQuery<ChatInteraction[]>({
    queryKey: ["chat-history", agentName, clientId],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!agentName || !clientId) {
        console.log("Missing required parameters for chat history:", { agentName, clientId });
        return [];
      }
      
      try {
        console.log(`Fetching chat history for client: ${clientId}, agent: ${agentName}`);
        
        // Use the centralized ai_agents table
        const { data: chatData, error } = await supabase
          .from('ai_agents')
          .select('id, content, metadata, created_at')
          .eq('client_id', clientId)
          .eq('agent_name', agentName)
          .eq('metadata->>type', 'chat_interaction')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching chat history:", error);
          return [];
        }

        // Transform and validate the data
        return (chatData || []).map(row => {
          // Cast metadata to access properties safely
          const metadata = row.metadata as Record<string, any>;
          
          return {
            id: Number(row.id),
            content: row.content || '',
            metadata: {
              timestamp: metadata?.timestamp || row.created_at || new Date().toISOString(),
              user_message: metadata?.user_message || '',
              type: metadata?.type || 'chat_interaction'
            }
          };
        });
      } catch (error) {
        console.error("Error in chat history query:", error);
        return [];
      }
    },
    enabled: !!agentName && !!clientId,
  });
};
