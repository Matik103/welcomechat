
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types/client-dashboard';
import { ChatInteraction } from '@/types/extended-supabase';

export const useClientDashboard = (clientId: string, agentName: string) => {
  // Fetch dashboard stats for the client
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['agentStats', clientId, agentName],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Call the stored procedure to get agent dashboard stats
        const { data, error } = await supabase.rpc('get_agent_dashboard_stats', {
          client_id_param: clientId, 
          agent_name_param: agentName
        });

        if (error) {
          console.error('Error fetching agent stats:', error);
          throw error;
        }

        if (!data) {
          return {
            totalInteractions: 0,
            activeDays: 0,
            averageResponseTime: 0,
            topQueries: []
          };
        }

        // Parse the result which is a JSON object containing the dashboard stats
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        // Map the result to our DashboardStats type
        return {
          totalInteractions: Number(parsedData.total_interactions || 0),
          activeDays: Number(parsedData.active_days || 0),
          averageResponseTime: Number(parsedData.average_response_time || 0),
          topQueries: Array.isArray(parsedData.top_queries) 
            ? parsedData.top_queries.map((q: any) => ({
                query_text: String(q.query_text || ''),
                frequency: Number(q.frequency || 0)
              }))
            : []
        };
      } catch (error) {
        console.error('Error in dashboard stats query:', error);
        return {
          totalInteractions: 0,
          activeDays: 0,
          averageResponseTime: 0,
          topQueries: []
        };
      }
    },
    enabled: !!clientId && !!agentName,
  });

  // Fetch recent chat interactions
  const {
    data: chatHistory,
    isLoading: isLoadingChat,
    error: chatError,
  } = useQuery({
    queryKey: ['clientChatHistory', clientId],
    queryFn: async (): Promise<ChatInteraction[]> => {
      try {
        // Query the ai_agents table for recent chat interactions for this client
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Map the results to our ChatInteraction type
        return (data || []).map(interaction => ({
          id: String(interaction.id),
          clientId: String(interaction.client_id),
          timestamp: String(interaction.created_at),
          query: String(interaction.query_text || ''),
          response: String(interaction.content || ''),
          agentName: String(interaction.name || 'AI Assistant'),
          responseTimeMs: Number(interaction.response_time_ms || 0),
          metadata: interaction.metadata || {}
        }));
      } catch (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const isLoading = isLoadingStats || isLoadingChat;

  return {
    agentName,
    stats: stats || {
      totalInteractions: 0,
      activeDays: 0,
      averageResponseTime: 0,
      topQueries: []
    },
    chatHistory: chatHistory || [],
    recentInteractions: chatHistory || [],
    isLoading,
  };
};
