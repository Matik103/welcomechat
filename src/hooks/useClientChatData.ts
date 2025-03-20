
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

export const useRecentChatInteractions = (clientId?: string, limit = 10) => {
  return useQuery({
    queryKey: ["recentInteractions", clientId, limit],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log(`Fetching recent interactions for client ${clientId}, limit: ${limit}`);
      
      // Query the ai_interactions table for chat interactions
      const { data, error } = await supabase
        .from("ai_interactions")
        .select("*")
        .eq("client_id", clientId)
        .eq("type", "chat")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Error fetching recent interactions:", error);
        throw error;
      }
      
      // Map the data to the ChatInteraction interface
      const interactions: ChatInteraction[] = data.map(item => ({
        id: item.id.toString(),
        client_id: item.client_id,
        clientId: item.client_id,
        agent_name: item.agent_name,
        query: item.query_text || "",
        response: item.response_text || "",
        created_at: item.created_at,
        timestamp: item.created_at,
        metadata: item.metadata || {},
        responseTimeMs: item.response_time_ms
      }));
      
      console.log(`Found ${interactions.length} recent interactions`);
      return interactions;
    },
    enabled: !!clientId,
  });
};

// Get chat sessions for a client
export const useChatSessions = (clientId?: string) => {
  return useQuery({
    queryKey: ["chatSessions", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      // Use a custom RPC function to get chat sessions
      const { data, error } = await supabase.rpc("get_chat_sessions_for_client", {
        client_id_param: clientId
      });
      
      if (error) {
        console.error("Error fetching chat sessions:", error);
        throw error;
      }
      
      return Array.isArray(data) && data.length > 0 ? data : [];
    },
    enabled: !!clientId,
  });
};

// Get chat history for a client
export const useChatHistory = (clientId?: string, limit = 50, sessionId?: string) => {
  return useQuery({
    queryKey: ["chatHistory", clientId, limit, sessionId],
    queryFn: async () => {
      if (!clientId) return [];
      
      // Build query to ai_interactions table
      let query = supabase
        .from("ai_interactions")
        .select("*")
        .eq("client_id", clientId)
        .eq("type", "chat");
      
      // Add session filter if provided
      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }
      
      // Execute query with ordering and limits
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Error fetching chat history:", error);
        throw error;
      }
      
      // Map the data to the ChatInteraction interface
      const interactions: ChatInteraction[] = data.map(item => ({
        id: item.id.toString(),
        client_id: item.client_id,
        clientId: item.client_id,
        agent_name: item.agent_name,
        query: item.query_text || "",
        response: item.response_text || "",
        created_at: item.created_at,
        timestamp: item.created_at,
        metadata: item.metadata || {},
        responseTimeMs: item.response_time_ms
      }));
      
      console.log(`Found ${interactions.length} chat history items`);
      return interactions;
    },
    enabled: !!clientId,
  });
};

export default useChatHistory;
