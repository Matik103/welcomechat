
import { supabase } from "@/integrations/supabase/client";
import { execSql, parseJsonResponse, mapJsonToObject } from "@/utils/rpcUtils";
import { ChatInteraction } from "@/types/agent";

/**
 * Fetch chat history for a client
 */
export const fetchChatHistory = async (clientId: string): Promise<ChatInteraction[]> => {
  try {
    // Use RPC function to get chat sessions
    const { data, error } = await supabase.rpc('get_chat_sessions_for_client', {
      client_id_param: clientId
    });
    
    if (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
    
    // Parse and map the data to our ChatInteraction type
    return (data || []).map((item: any) => ({
      id: item.id || '',
      client_id: item.client_id || '',
      query_text: item.query_text || '',
      response: item.response_text || '',
      created_at: item.created_at || new Date().toISOString(),
      agent_name: item.agent_name || '',
      response_time_ms: item.response_time_ms || 0,
      metadata: item.metadata || {}
    }));
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
};

/**
 * Fetch recent interactions for a client
 */
export const fetchRecentInteractions = async (clientId: string, limit = 5): Promise<ChatInteraction[]> => {
  try {
    // Use RPC function to get recent interactions
    const { data, error } = await supabase.rpc('get_recent_interactions', {
      client_id_param: clientId,
      limit_param: limit
    });
    
    if (error) {
      console.error("Error fetching recent interactions:", error);
      throw error;
    }
    
    // Parse and map the data to our ChatInteraction type
    return (data || []).map((item: any) => ({
      id: item.id || '',
      client_id: item.client_id || '',
      query_text: item.query_text || '',
      response: item.response_text || '',
      created_at: item.created_at || new Date().toISOString(),
      agent_name: item.agent_name || '',
      response_time_ms: item.response_time_ms || 0,
      metadata: item.metadata || {}
    }));
  } catch (error) {
    console.error("Failed to fetch recent interactions:", error);
    throw error;
  }
};

/**
 * Log a new chat interaction
 */
export const logChatInteraction = async (interaction: Omit<ChatInteraction, 'id' | 'created_at'>): Promise<string> => {
  try {
    const { data, error } = await supabase.from('ai_interactions').insert({
      client_id: interaction.client_id,
      agent_name: interaction.agent_name,
      query_text: interaction.query_text,
      response_text: interaction.response,
      response_time_ms: interaction.response_time_ms,
      metadata: interaction.metadata || {}
    }).select('id').single();
    
    if (error) {
      console.error("Error logging chat interaction:", error);
      throw error;
    }
    
    return data?.id || '';
  } catch (error) {
    console.error("Failed to log chat interaction:", error);
    throw error;
  }
};
