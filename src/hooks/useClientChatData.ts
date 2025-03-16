
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";
import { InteractionStats, QueryItem } from "@/types/client-dashboard";
import { getAgentDashboardStats } from "@/services/agentQueryService";

/**
 * Transforms raw stats into InteractionStats format
 */
const transformStats = (data: any): InteractionStats => {
  // Handle missing or invalid data
  if (!data) {
    const defaultStats: InteractionStats = {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
    return defaultStats;
  }

  // Process top queries to ensure they match the required format
  const processedQueries: QueryItem[] = Array.isArray(data.top_queries) 
    ? data.top_queries.map((query: any, index: number) => {
        // Handle different possible formats
        if (typeof query === 'object' && query !== null) {
          return {
            id: `query-${index}`,
            query_text: query.query_text || 'Unknown query',
            frequency: typeof query.frequency === 'number' ? query.frequency : 1
          };
        } else if (typeof query === 'string') {
          return {
            id: `query-${index}`,
            query_text: query,
            frequency: 1
          };
        }
        return {
          id: `query-${index}`,
          query_text: 'Unknown query',
          frequency: 1
        };
      })
    : [];

  // Create a properly typed object
  return {
    total_interactions: data.total_interactions,
    active_days: data.active_days,
    average_response_time: data.average_response_time,
    top_queries: processedQueries
  };
};

/**
 * Validates and ensures the stats object has proper values
 */
export const validateStats = (stats: InteractionStats): InteractionStats => {
  return {
    total_interactions: stats.total_interactions || 0,
    active_days: stats.active_days || 0,
    average_response_time: stats.average_response_time || 0,
    top_queries: Array.isArray(stats.top_queries) ? stats.top_queries : []
  };
};

/**
 * Hook to get agent name for a client
 */
export const useAgentName = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-name', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('agent_name')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error("Error fetching agent name:", error);
        return null;
      }
      
      return data?.agent_name || null;
    },
    enabled: !!clientId
  });
};

// Hook for fetching client dashboard statistics
export const useClientDashboardStats = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['client-dashboard-stats', clientId],
    queryFn: async () => {
      if (!clientId) return transformStats(null);
      
      try {
        const stats = await getAgentDashboardStats(clientId);
        return transformStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return transformStats(null);
      }
    },
    enabled: !!clientId
  });
};

/**
 * Hook for agent stats with refresh capability
 */
export const useAgentStats = (clientId: string | undefined, agentName: string | undefined) => {
  const { 
    data: stats = {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    }, 
    isLoading: isLoadingStats,
    refetch
  } = useQuery({
    queryKey: ['agent-stats', clientId, agentName],
    queryFn: async () => {
      if (!clientId || !agentName) return transformStats(null);
      
      try {
        const stats = await getAgentDashboardStats(clientId);
        return transformStats(stats);
      } catch (error) {
        console.error("Error fetching agent stats:", error);
        return transformStats(null);
      }
    },
    enabled: !!clientId && !!agentName
  });

  return {
    stats,
    isLoadingStats,
    refreshStats: refetch
  };
};

// Hook for fetching client chat history
export const useChatHistory = (clientId: string | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: ['client-chat-history', clientId, limit],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        // Get the client's agent name
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('agent_name')
          .eq('id', clientId)
          .single();
          
        if (clientError || !clientData?.agent_name) {
          console.error("Error fetching client agent name:", clientError);
          return [];
        }
        
        // Query the ai_agents table for chat interactions
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('name', clientData.agent_name)
          .eq('interaction_type', 'chat_interaction')
          .eq('is_error', false)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error("Error fetching chat history:", error);
          return [];
        }
        
        // Transform to ChatInteraction objects
        return data.map((item): ChatInteraction => ({
          id: item.id,
          query: item.query_text || '',
          response: item.content || '',
          timestamp: item.created_at || new Date().toISOString(),
          clientId: item.client_id,
          responseTimeMs: item.response_time_ms || 0,
          content: item.content || '',
          metadata: item.settings || {}
        }));
      } catch (error) {
        console.error("Error in useClientChatHistory:", error);
        return [];
      }
    },
    enabled: !!clientId
  });
};

// Hook for generating dashboard stats from local data
export const useLocalDashboardStats = (chatHistory: ChatInteraction[]): InteractionStats => {
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });

  useEffect(() => {
    if (chatHistory.length === 0) {
      setStats({
        total_interactions: 0,
        active_days: 0,
        average_response_time: 0,
        top_queries: []
      });
      return;
    }

    try {
      // Calculate total interactions
      const totalInteractions = chatHistory.length;
      
      // Calculate unique active days
      const uniqueDates = new Set<string>();
      chatHistory.forEach(interaction => {
        if (interaction.timestamp) {
          const date = new Date(interaction.timestamp).toDateString();
          uniqueDates.add(date);
        }
      });
      const activeDays = uniqueDates.size;
      
      // Calculate average response time
      let totalResponseTime = 0;
      let interactionsWithTime = 0;
      
      chatHistory.forEach(interaction => {
        if (interaction.responseTimeMs) {
          totalResponseTime += interaction.responseTimeMs;
          interactionsWithTime++;
        }
      });
      
      const avgResponseTime = interactionsWithTime > 0
        ? Number((totalResponseTime / interactionsWithTime / 1000).toFixed(2))
        : 0;
        
      // Calculate top queries
      const queryCountMap: Record<string, number> = {};
      
      chatHistory.forEach(interaction => {
        if (interaction.query) {
          if (queryCountMap[interaction.query]) {
            queryCountMap[interaction.query]++;
          } else {
            queryCountMap[interaction.query] = 1;
          }
        }
      });
      
      // Convert to array and sort
      const topQueries: QueryItem[] = Object.entries(queryCountMap)
        .map(([query_text, frequency]) => ({ 
          id: `query-${query_text.substring(0, 10)}`,
          query_text, 
          frequency 
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);
      
      setStats({
        total_interactions: totalInteractions,
        active_days: activeDays,
        average_response_time: avgResponseTime,
        top_queries: topQueries
      });
    } catch (error) {
      console.error("Error calculating local dashboard stats:", error);
      setStats({
        total_interactions: chatHistory.length,
        active_days: 0,
        average_response_time: 0,
        top_queries: []
      });
    }
  }, [chatHistory]);

  return stats;
};
