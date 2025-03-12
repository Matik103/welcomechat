import { InteractionStats } from "@/types/client-dashboard";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopQueries } from "./topQueriesService";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { Client } from '@/types/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface DashboardStats {
  totalMessages: number;
  totalSessions: number;
  averageResponseTime: number;
}

export interface AIAgentStats {
  totalInteractions: number;
  activeDays: number;
  avgResponseTime: number;
  commonTopics: Array<{ topic: string; count: number }>;
  recentErrors: Array<{ message: string; timestamp: string }>;
  recentLogs: Array<{ message: string; timestamp: string }>;
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

export async function fetchAIAgentStats(agentId: string): Promise<{ data: AIAgentStats | null; error: PostgrestError | null }> {
  try {
    // Get the AI agent data first to ensure it exists
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError) throw agentError;
    if (!agentData) throw new Error('AI Agent not found');

    // Get total successful interactions count
    const { count: totalInteractions, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('ai_agent_id', agentId)
      .eq('status', 'completed'); // Only count completed interactions

    if (countError) throw countError;

    // Get active days count using distinct dates
    const { data: activeDays, error: daysError } = await supabase
      .from('interactions')
      .select('created_at')
      .eq('ai_agent_id', agentId)
      .eq('status', 'completed')
      .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false });

    if (daysError) throw daysError;

    const uniqueDays = new Set(
      (activeDays || []).map(i => new Date(i.created_at).toDateString())
    );

    // Get average response time from completed interactions
    const { data: avgTimeData, error: avgTimeError } = await supabase
      .rpc('calculate_avg_response_time', { p_agent_id: agentId });

    if (avgTimeError) throw avgTimeError;

    // Get common topics with their counts
    const { data: topicsData, error: topicsError } = await supabase
      .rpc('get_common_topics', { 
        p_agent_id: agentId,
        p_limit: 5
      });

    if (topicsError) throw topicsError;

    // Get recent errors with context
    const { data: recentErrors, error: errorsError } = await supabase
      .from('error_logs')
      .select(`
        message,
        created_at,
        context:metadata->>'context',
        severity
      `)
      .eq('ai_agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (errorsError) throw errorsError;

    // Get recent logs with metadata
    const { data: recentLogs, error: logsError } = await supabase
      .from('agent_logs')
      .select(`
        message,
        created_at,
        metadata,
        log_level
      `)
      .eq('ai_agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) throw logsError;

    return {
      data: {
        totalInteractions: totalInteractions || 0,
        activeDays: uniqueDays.size,
        avgResponseTime: avgTimeData?.average_response_time || 0,
        commonTopics: topicsData || [],
        recentErrors: (recentErrors || []).map(e => ({
          message: `[${e.severity}] ${e.message}${e.context ? ` (${e.context})` : ''}`,
          timestamp: e.created_at
        })),
        recentLogs: (recentLogs || []).map(l => ({
          message: `[${l.log_level}] ${l.message}`,
          timestamp: l.created_at
        }))
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching AI agent stats:', error);
    return {
      data: null,
      error: error as PostgrestError
    };
  }
}
