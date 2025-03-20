
import { supabase } from '@/integrations/supabase/client';
import { ChatInteraction } from '@/types/client';

// Get chat sessions for a client using RPC instead of direct table access
export const getChatSessions = async (clientId: string): Promise<ChatInteraction[]> => {
  try {
    const { data, error } = await supabase.rpc('get_ai_interactions', {
      client_id_param: clientId
    });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform data to match ChatInteraction interface
    return data.map(item => ({
      id: item.id,
      clientId: item.client_id,
      timestamp: item.created_at,
      query: item.query_text || '',
      response: item.response_text || '',
      agentName: item.agent_name || '',
      responseTimeMs: item.response_time_ms,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Error in getChatSessions:', error);
    return [];
  }
};

// Get recent interaction history
export const getRecentInteractions = async (clientId: string, limit = 10): Promise<ChatInteraction[]> => {
  try {
    const { data, error } = await supabase.rpc('get_recent_interactions', {
      client_id_param: clientId,
      limit_param: limit
    });

    if (error) {
      console.error('Error fetching recent interactions:', error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform data to match ChatInteraction interface
    return data.map(item => ({
      id: item.id,
      clientId: item.client_id,
      timestamp: item.created_at,
      query: item.query_text || '',
      response: item.response_text || '',
      agentName: item.agent_name || '',
      responseTimeMs: item.response_time_ms,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Error in getRecentInteractions:', error);
    return [];
  }
};
