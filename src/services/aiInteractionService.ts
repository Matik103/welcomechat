
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

/**
 * Fetch chat history for a specific client
 */
export const fetchChatHistory = async (clientId: string): Promise<ChatInteraction[]> => {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, client_id, name, query_text, content, response_time_ms, created_at")
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      client_id: item.client_id,
      agent_name: item.name,
      query_text: item.query_text || "",
      response: item.content || "",
      response_time_ms: item.response_time_ms || 0,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
};

/**
 * Fetch recent interactions for a dashboard view
 */
export const fetchRecentInteractions = async (clientId: string): Promise<ChatInteraction[]> => {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, client_id, name, query_text, content, response_time_ms, created_at")
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      client_id: item.client_id,
      agent_name: item.name,
      query_text: item.query_text || "",
      response: item.content || "",
      response_time_ms: item.response_time_ms || 0,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error("Error fetching recent interactions:", error);
    return [];
  }
};
