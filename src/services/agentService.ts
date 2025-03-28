
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  agent_description: string;
  status: string;
  last_active: string;
  total_interactions: number;
  average_response_time: number;
}

/**
 * Get all agents with their statistics
 */
export const getAllAgents = async (): Promise<Agent[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select(`
        id,
        name,
        client_id,
        client_name,
        agent_description,
        status,
        last_active,
        response_time_ms
      `)
      .eq('interaction_type', 'config')
      .eq('status', 'active')  // Only get active agents
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include calculated statistics
    const agents = await Promise.all(
      (data || []).map(async (agent) => {
        // Get total interactions for this agent
        const { count: totalInteractions } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', agent.client_id)
          .eq('name', agent.name)
          .eq('interaction_type', 'chat_interaction');

        // Get average response time
        const { data: responseTimes } = await supabase
          .from('ai_agents')
          .select('response_time_ms')
          .eq('client_id', agent.client_id)
          .eq('name', agent.name)
          .eq('interaction_type', 'chat_interaction')
          .not('response_time_ms', 'is', null);

        const avgResponseTime = responseTimes && responseTimes.length > 0
          ? responseTimes.reduce((sum, rt) => sum + (rt.response_time_ms || 0), 0) / responseTimes.length
          : 0;

        return {
          ...agent,
          total_interactions: totalInteractions || 0,
          average_response_time: avgResponseTime / 1000 // Convert to seconds
        };
      })
    );

    return agents;
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
};

/**
 * Get a single agent by ID
 */
export const getAgentById = async (agentId: string): Promise<Agent | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select(`
        id,
        name,
        client_id,
        client_name,
        agent_description,
        status,
        last_active,
        response_time_ms
      `)
      .eq('id', agentId)
      .eq('interaction_type', 'config')
      .eq('status', 'active')  // Only get active agents
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Get total interactions
    const { count: totalInteractions } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', data.client_id)
      .eq('name', data.name)
      .eq('interaction_type', 'chat_interaction');

    // Get average response time
    const { data: responseTimes } = await supabase
      .from('ai_agents')
      .select('response_time_ms')
      .eq('client_id', data.client_id)
      .eq('name', data.name)
      .eq('interaction_type', 'chat_interaction')
      .not('response_time_ms', 'is', null);

    const avgResponseTime = responseTimes && responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + (rt.response_time_ms || 0), 0) / responseTimes.length
      : 0;

    return {
      ...data,
      total_interactions: totalInteractions || 0,
      average_response_time: avgResponseTime / 1000 // Convert to seconds
    };
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
};

/**
 * Update agent status
 */
export const updateAgentStatus = async (agentId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({ status })
      .eq('id', agentId)
      .eq('interaction_type', 'config');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating agent status:', error);
    return false;
  }
};
