import { supabase } from '@/integrations/supabase/client';

export async function logInteraction(
  agentId: string,
  topic: string,
  responseTime: number
) {
  try {
    const { data, error } = await supabase.rpc('log_interaction', {
      p_ai_agent_id: agentId,
      p_topic: topic,
      p_response_time: responseTime
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging interaction:', error);
    throw error;
  }
}

export async function logError(agentId: string, message: string) {
  try {
    const { error } = await supabase
      .from('error_logs')
      .insert({
        ai_agent_id: agentId,
        message
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging error:', error);
    throw error;
  }
}

export async function logAgentActivity(agentId: string, message: string) {
  try {
    const { error } = await supabase
      .from('agent_logs')
      .insert({
        ai_agent_id: agentId,
        message
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging agent activity:', error);
    throw error;
  }
} 