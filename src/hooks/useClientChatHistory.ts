
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/client";
import { execSql } from "@/utils/rpcUtils";

/**
 * Custom hook to fetch chat history for a specific client
 */
export const useClientChatHistory = (clientId?: string) => {
  const { data: chatHistory, isLoading, error, refetch } = useQuery({
    queryKey: ["chatHistory", clientId],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching chat history for client: ${clientId}`);
        
        // Use SQL query via RPC to get chat history
        const sql = `
          SELECT id, client_id, agent_name, query_text, content as response, 
                 created_at, response_time_ms, metadata
          FROM ai_agents
          WHERE client_id = $1
            AND interaction_type = 'chat_interaction'
          ORDER BY created_at DESC
          LIMIT 50
        `;
        
        const data = await execSql(sql, { client_id: clientId });
        
        if (!Array.isArray(data)) {
          console.error("Unexpected response format:", data);
          return [];
        }
        
        // Map the data to our ChatInteraction type
        const interactions: ChatInteraction[] = data.map(item => ({
          id: item.id,
          clientId: item.client_id,
          query: item.query_text,
          response: item.response,
          timestamp: item.created_at,
          agentName: item.agent_name,
          responseTimeMs: item.response_time_ms,
          metadata: item.metadata
        }));
        
        return interactions;
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }
    },
    enabled: !!clientId,
    refetchInterval: 60000, // refresh every minute
  });

  // Debug information to help diagnose issues
  const debug = {
    clientId,
    isLoading,
    error,
    chatHistoryLength: chatHistory?.length || 0,
  };

  return {
    chatHistory: chatHistory || [],
    isLoading,
    error,
    refetch,
    debug
  };
};

/**
 * Custom hook to fetch only recent chat interactions
 */
export const useRecentChatInteractions = (clientId?: string, limit: number = 5) => {
  const { data: recentInteractions, isLoading, error, refetch } = useQuery({
    queryKey: ["recentChatInteractions", clientId, limit],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching recent chat interactions for client: ${clientId}, limit: ${limit}`);
        
        // Use SQL query via RPC to get recent interactions
        const sql = `
          SELECT id, client_id, agent_name, query_text, content as response, 
                 created_at, response_time_ms, metadata
          FROM ai_agents
          WHERE client_id = $1
            AND interaction_type = 'chat_interaction'
          ORDER BY created_at DESC
          LIMIT $2
        `;
        
        const data = await execSql(sql, { client_id: clientId, limit });
        
        if (!Array.isArray(data)) {
          console.error("Unexpected response format:", data);
          return [];
        }
        
        // Map the data to our ChatInteraction type
        const interactions: ChatInteraction[] = data.map(item => ({
          id: item.id,
          clientId: item.client_id,
          query: item.query_text,
          response: item.response,
          timestamp: item.created_at,
          agentName: item.agent_name,
          responseTimeMs: item.response_time_ms,
          metadata: item.metadata
        }));
        
        return interactions;
      } catch (error) {
        console.error("Error fetching recent chat interactions:", error);
        return [];
      }
    },
    enabled: !!clientId,
    refetchInterval: 60000, // refresh every minute
  });

  return {
    recentInteractions: recentInteractions || [],
    isLoading,
    error,
    refetch
  };
};
