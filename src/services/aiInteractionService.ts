
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/client";
import { execSql } from "@/utils/rpcUtils";

/**
 * Fetch chat history for a client
 */
export const fetchChatHistory = async (clientId: string): Promise<ChatInteraction[]> => {
  try {
    // Use SQL query via RPC to get chat history safely
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
};

/**
 * Fetch recent chat interactions for a client
 */
export const fetchRecentInteractions = async (
  clientId: string, 
  limit: number = 5
): Promise<ChatInteraction[]> => {
  try {
    // Use SQL query via RPC to get recent interactions safely
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
};

/**
 * Log a new chat interaction
 */
export const logChatInteraction = async (
  clientId: string,
  agentName: string,
  query: string,
  response: string,
  responseTimeMs?: number,
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    // Insert directly to ai_agents table with interaction_type = 'chat_interaction'
    const { data, error } = await supabase.from('ai_agents').insert({
      client_id: clientId,
      name: agentName,
      interaction_type: 'chat_interaction',
      query_text: query,
      content: response,
      response_time_ms: responseTimeMs,
      metadata: metadata || {}
    }).select('id').single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error("Error logging chat interaction:", error);
    throw error;
  }
};
