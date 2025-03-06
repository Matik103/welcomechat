
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

export const useClientChatHistory = (agentName: string | undefined) => {
  return useQuery<ChatInteraction[]>({
    queryKey: ["chat-history", agentName],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!agentName) return [];
      
      try {
        // Use table select based on agent name
        let query;
        switch (agentName.toLowerCase()) {
          case 'coca cola':
            query = supabase.from('coca_cola');
            break;
          case 'the agent':
            query = supabase.from('the_agent');
            break;
          case 'ai agent':
            query = supabase.from('ai_agent');
            break;
          default:
            console.error('Unknown agent type:', agentName);
            return [];
        }
        
        const { data: chatData, error } = await query
          .select('id, content, metadata')
          .eq('metadata->>type', 'chat_interaction')
          .order('id', { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching chat history:", error);
          return [];
        }

        // Transform and validate the data
        return (chatData || []).map(row => ({
          id: Number(row.id),
          content: row.content || '',
          metadata: {
            timestamp: row.metadata?.timestamp || new Date().toISOString(),
            user_message: row.metadata?.user_message || '',
            type: row.metadata?.type || 'chat_interaction'
          }
        }));
      } catch (error) {
        console.error("Error in chat history query:", error);
        return [];
      }
    },
    enabled: !!agentName,
  });
};
