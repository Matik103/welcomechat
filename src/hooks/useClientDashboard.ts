
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import types
import { ErrorLog, InteractionStats, QueryItem } from "@/types/client-dashboard";

// Import services
import { fetchErrorLogs, subscribeToErrorLogs } from "@/services/errorLogService";
import { fetchQueries, subscribeToQueries } from "@/services/queryService";
import { getAgentDashboardStats } from "@/services/agentQueryService";
import { subscribeToActivities } from "@/services/activitySubscriptionService";

export type { ErrorLog, InteractionStats, QueryItem };

export const useClientDashboard = (clientId: string | undefined) => {
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [authError, setAuthError] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Query error logs for this client
  const { 
    data: errorLogs = [], 
    isLoading: isLoadingErrorLogs,
    refetch: refetchErrorLogs 
  } = useQuery({
    queryKey: ["errorLogs", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      try {
        return await fetchErrorLogs(clientId);
      } catch (error: any) {
        if (error.code === "PGRST301" || error.message?.includes("JWT")) {
          setAuthError(true);
        }
        throw error;
      }
    },
    enabled: !!clientId,
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3, // Increase retries
  });

  // Query common queries for this client
  const { 
    data: queries = [], 
    isLoading: isLoadingQueries,
    refetch: refetchQueries 
  } = useQuery({
    queryKey: ["queries", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      try {
        return await fetchQueries(clientId);
      } catch (error: any) {
        if (error.code === "PGRST301" || error.message?.includes("JWT")) {
          setAuthError(true);
        }
        throw error;
      }
    },
    enabled: !!clientId,
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3, // Increase retries
  });

  // Function to fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!clientId) {
      setIsLoadingStats(false);
      return;
    }

    setIsLoadingStats(true);
    try {
      // First try to get agent name from user metadata
      const { data: userData } = await supabase.auth.getUser();
      const agentName = userData.user?.user_metadata?.agent_name;
      
      if (clientId && agentName) {
        // Use the new dedicated function if we have both client ID and agent name
        console.log("Getting agent stats using dedicated function");
        const statsData = await getAgentDashboardStats(clientId, agentName);
        if (statsData) {
          setStats(statsData);
          setAuthError(false);
          setIsLoadingStats(false);
          setIsRefreshing(false);
          return;
        }
      }
      
      // If we don't have the agent name or the above request failed,
      // try to get it from the client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('agent_name')
        .eq('id', clientId)
        .single();
        
      if (clientError) {
        console.error("Error fetching client data:", clientError);
        throw clientError;
      }
      
      if (clientData?.agent_name) {
        // Use the agent name from the client record
        console.log("Using agent name from client record:", clientData.agent_name);
        const statsData = await getAgentDashboardStats(clientId, clientData.agent_name);
        setStats(statsData);
        setAuthError(false);
      } else {
        throw new Error("No agent name found for this client");
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      if (err.message === "Authentication failed" || err.code === "PGRST301" || err.message?.includes("JWT")) {
        setAuthError(true);
      }
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        fetchStats(),
        refetchErrorLogs(),
        refetchQueries()
      ]);
      
      toast.success("Dashboard refreshed successfully");
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStats, refetchErrorLogs, refetchQueries]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!clientId) return;
    
    let aiAgentsChannel: any = null;
    let errorLogsChannel: any = null;
    let queriesChannel: any = null;
    let activitiesChannel: any = null;
    
    // Setup subscriptions
    const setupSubscriptions = async () => {
      // Subscribe to the AI agents table for this client
      aiAgentsChannel = supabase
        .channel(`ai-agents-${clientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_agents',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            console.log("AI agent data change detected:", payload);
            fetchStats();
          }
        )
        .subscribe();
      
      // Setup other channels
      errorLogsChannel = subscribeToErrorLogs(clientId, refetchErrorLogs);
      queriesChannel = subscribeToQueries(clientId, refetchQueries);
      activitiesChannel = subscribeToActivities(clientId, fetchStats);
    };
    
    setupSubscriptions();
    
    return () => {
      // Clean up all channels
      if (aiAgentsChannel) supabase.removeChannel(aiAgentsChannel);
      if (errorLogsChannel) supabase.removeChannel(errorLogsChannel);
      if (queriesChannel) supabase.removeChannel(queriesChannel);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
    };
  }, [clientId, fetchStats, refetchErrorLogs, refetchQueries]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
    isLoadingStats,
    isRefreshing,
    authError,
    refreshDashboard: handleRefresh
  };
};
