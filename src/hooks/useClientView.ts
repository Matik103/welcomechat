
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

export const useClientView = () => {
  const { id } = useParams();

  // Query client data
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Query the AI agent's vector table for chat history
  const { data: chatHistory } = useQuery<ChatInteraction[]>({
    queryKey: ["chat-history", client?.agent_name],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!client?.agent_name) return [];
      
      try {
        // Use table select based on agent name
        let query;
        switch (client.agent_name.toLowerCase()) {
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
            console.error('Unknown agent type:', client.agent_name);
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
    enabled: !!client?.agent_name,
  });

  // Query common end-user questions
  const { data: commonQueries } = useQuery({
    queryKey: ["common-queries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", id)
        .order("frequency", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query error logs for chatbot issues
  const { data: errorLogs } = useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return {
    client,
    isLoadingClient,
    chatHistory,
    commonQueries,
    errorLogs
  };
};
