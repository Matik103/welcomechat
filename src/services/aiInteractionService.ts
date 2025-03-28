
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

/**
 * Get total count of interactions across all clients
 */
export const getTotalInteractionsCount = async (): Promise<{ total: number, recent: number, changePercentage: number }> => {
  try {
    // Get total interactions count
    const { count: totalCount, error: countError } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('interaction_type', 'chat_interaction');
      
    if (countError) throw countError;
    
    // Get recent interactions (last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    
    const { count: recentCount, error: recentError } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('interaction_type', 'chat_interaction')
      .gt('created_at', timeAgo.toISOString());
      
    if (recentError) throw recentError;
    
    // Calculate change percentage
    const previousPeriodCount = totalCount - recentCount;
    let changePercentage = 0;
    
    if (previousPeriodCount > 0) {
      changePercentage = Math.round((recentCount / previousPeriodCount) * 100) / 5;
    }
    
    return {
      total: totalCount || 0,
      recent: recentCount || 0,
      changePercentage
    };
  } catch (error) {
    console.error("Error getting interactions count:", error);
    return { total: 0, recent: 0, changePercentage: 0 };
  }
};
