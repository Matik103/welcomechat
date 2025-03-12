import { InteractionStats } from "@/types/client-dashboard";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopQueries } from "./topQueriesService";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { Client } from '@/types/supabase';

export interface DashboardStats {
  totalMessages: number;
  totalSessions: number;
  averageResponseTime: number;
}

/**
 * Fetches dashboard statistics for a specific client
 */
export const fetchDashboardStats = async (clientId: string): Promise<DashboardStats> => {
  try {
    // Query the ai_agent table directly
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agent')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (agentError) throw agentError;

    // Query messages and sessions from their respective tables
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId);

    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId);

    // Calculate average response time from messages
    const { data: responseTimes } = await supabase
      .from('messages')
      .select('response_time')
      .eq('client_id', clientId)
      .not('response_time', 'is', null);

    const avgResponseTime = responseTimes?.reduce((acc, curr) => acc + (curr.response_time || 0), 0) / (responseTimes?.length || 1);

    return {
      totalMessages: messageCount || 0,
      totalSessions: sessionCount || 0,
      averageResponseTime: avgResponseTime || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalMessages: 0,
      totalSessions: 0,
      averageResponseTime: 0,
    };
  }
};

/**
 * Sets up a real-time subscription for client's AI agent table
 * @param clientId - The client ID to subscribe to
 * @param onUpdate - Callback function that will be called when updates occur
 * @returns The subscription channel for cleanup
 */
export const subscribeToAgentData = (clientId: string, callback: (data: any) => void): RealtimeChannel => {
  return supabase
    .channel(`agent-data-${clientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ai_agent',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};

export const subscribeToActivities = (clientId: string, callback: (data: any) => void): RealtimeChannel => {
  return supabase
    .channel(`activities-${clientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};
