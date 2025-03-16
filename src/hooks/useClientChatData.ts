
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";
import { InteractionStats } from "@/types/client-dashboard";
import { getAgentDashboardStats } from "@/services/agentQueryService";

/**
 * Helper function to validate and convert to InteractionStats
 */
export const validateStats = (data: any): InteractionStats => {
  // Default stats object to return if validation fails
  const defaultStats: InteractionStats = {
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  };

  // If data is not an object or is null/array, return default stats
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    console.error("Invalid stats data type:", data);
    return defaultStats;
  }

  // Check if all required properties exist and have the correct types
  const hasValidProperties = 
    'total_interactions' in data && typeof data.total_interactions === 'number' &&
    'active_days' in data && typeof data.active_days === 'number' &&
    'average_response_time' in data && typeof data.average_response_time === 'number' &&
    'top_queries' in data && Array.isArray(data.top_queries);

  if (!hasValidProperties) {
    console.error("Stats data missing required properties:", data);
    return defaultStats;
  }

  // Create a properly typed object
  return {
    total_interactions: data.total_interactions,
    active_days: data.active_days,
    average_response_time: data.average_response_time,
    top_queries: data.top_queries
  };
};

/**
 * Hook to fetch agent stats for a specific client and agent
 */
export const useAgentStats = (clientId?: string, agentName?: string) => {
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });
  const [authError, setAuthError] = useState(false);

  // Function to fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!clientId || !agentName) {
      setIsLoadingStats(false);
      return;
    }

    setIsLoadingStats(true);
    try {
      // Use the dedicated function for agent dashboard stats
      console.log(`Fetching stats for clientId: ${clientId}, agent: ${agentName}`);
      const statsData = await getAgentDashboardStats(clientId, agentName);
      
      if (statsData) {
        // Validate and convert the data
        const validStats = validateStats(statsData);
        setStats(validStats);
        setAuthError(false);
      } else {
        // Fallback for no stats returned - directly query the ai_agents table
        const { data: aiAgents, error: aiError } = await supabase
          .from("ai_agents")
          .select("id, content, query_text, response_time_ms, created_at")
          .eq("client_id", clientId)
          .eq("name", agentName)
          .eq("interaction_type", "chat_interaction");
          
        if (aiError) {
          console.error("Fallback query error:", aiError);
          throw aiError;
        }
        
        if (aiAgents && aiAgents.length > 0) {
          // Calculate basic stats manually
          const totalInteractions = aiAgents.length;
          
          // Calculate unique days
          const uniqueDays = new Set();
          aiAgents.forEach(item => {
            if (item.created_at) {
              uniqueDays.add(new Date(item.created_at).toDateString());
            }
          });
          
          // Calculate average response time
          let totalResponseTime = 0;
          let responsesWithTime = 0;
          aiAgents.forEach(item => {
            if (item.response_time_ms) {
              totalResponseTime += item.response_time_ms;
              responsesWithTime++;
            }
          });
          
          const avgResponseTime = responsesWithTime > 0 
            ? Number((totalResponseTime / responsesWithTime / 1000).toFixed(2)) 
            : 0;
          
          // Calculate top queries
          const queryCounts: Record<string, number> = {};
          aiAgents.forEach(item => {
            if (item.query_text) {
              queryCounts[item.query_text] = (queryCounts[item.query_text] || 0) + 1;
            }
          });
          
          const topQueries = Object.entries(queryCounts)
            .map(([query_text, frequency]) => ({ query_text, frequency }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
          
          setStats({
            total_interactions: totalInteractions,
            active_days: uniqueDays.size,
            average_response_time: avgResponseTime,
            top_queries: topQueries
          });
        } else {
          throw new Error("No stats data returned and no AI agents found");
        }
      }
    } catch (err: any) {
      console.error("Error fetching agent stats:", err);
      if (err.message === "Authentication failed" || err.code === "PGRST301" || err.message?.includes("JWT")) {
        setAuthError(true);
      }
    } finally {
      setIsLoadingStats(false);
    }
  }, [clientId, agentName]);

  // Initial fetch
  useQuery({
    queryKey: ["agentStats", clientId, agentName],
    queryFn: fetchStats,
    enabled: !!clientId && !!agentName,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    stats,
    isLoadingStats,
    authError,
    refreshStats: fetchStats
  };
};

/**
 * Hook to fetch chat history for a specific agent by name
 */
export const useChatHistory = (agentName?: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["chatHistory", agentName, limit],
    queryFn: async () => {
      if (!agentName) return [];
      
      console.log(`Fetching chat history for agent: ${agentName}, limit: ${limit}`);
      
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, content, query_text, created_at, settings")
        .eq("name", agentName)
        .eq("interaction_type", "chat_interaction")
        .eq("is_error", false)
        .order("created_at", { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error("Error fetching chat history:", error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} chat history entries`);
      
      // Transform to match the ChatInteraction interface
      return (data || []).map(item => ({
        id: item.id,
        content: item.content || "",
        metadata: {
          user_message: item.query_text || "",
          timestamp: item.created_at,
          // Safely handle settings - ensure it's an object before trying to spread
          ...(item.settings && typeof item.settings === 'object' ? item.settings : {})
        }
      })) as ChatInteraction[];
    },
    enabled: !!agentName,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Get the agent name for a client by ID
 */
export const useAgentName = (clientId?: string) => {
  return useQuery({
    queryKey: ["clientAgentName", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('agent_name')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error("Error fetching client agent name:", error);
        throw error;
      }
      
      return data?.agent_name || null;
    },
    enabled: !!clientId
  });
};

/**
 * Combined hook for client chat data that manages both chat history and stats
 */
export const useClientChatData = (clientId?: string) => {
  // First get the agent name for this client
  const { data: agentName, isLoading: isLoadingAgentName } = useAgentName(clientId);
  
  // Get stats using the agent name
  const { 
    stats, 
    isLoadingStats, 
    authError, 
    refreshStats
  } = useAgentStats(clientId, agentName || undefined);
  
  // Get chat history using the agent name
  const { 
    data: chatHistory = [], 
    isLoading: isLoadingChatHistory,
    refetch: refetchChatHistory
  } = useChatHistory(agentName || undefined);

  // Combined refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshStats(),
      refetchChatHistory()
    ]);
  }, [refreshStats, refetchChatHistory]);

  return {
    agentName,
    chatHistory,
    stats,
    isLoading: isLoadingAgentName || isLoadingStats || isLoadingChatHistory,
    isLoadingAgentName,
    isLoadingStats,
    isLoadingChatHistory,
    authError,
    refreshAll,
    refreshStats,
    refetchChatHistory
  };
};
