
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import types
import { ErrorLog, InteractionStats, QueryItem } from "@/types/client-dashboard";

// Import services
import { fetchErrorLogs, subscribeToErrorLogs } from "@/services/errorLogService";
import { fetchQueries, subscribeToQueries } from "@/services/queryService";
import { subscribeToActivities } from "@/services/activitySubscriptionService";

// Import the new utility functions
import { useAgentName, useAgentStats, validateStats } from "./useClientChatData";

export type { ErrorLog, InteractionStats, QueryItem };

export const useClientDashboard = (clientId: string | undefined) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // Get agent name for this client
  const { data: agentName } = useAgentName(clientId);
  
  // Get the stats directly from our new hook
  const { 
    stats, 
    isLoadingStats,
    refreshStats 
  } = useAgentStats(clientId, agentName || undefined);

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

  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        refreshStats(),
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
  }, [refreshStats, refetchErrorLogs, refetchQueries]);

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
            refreshStats();
          }
        )
        .subscribe();
      
      // Setup other channels
      errorLogsChannel = subscribeToErrorLogs(clientId, refetchErrorLogs);
      queriesChannel = subscribeToQueries(clientId, refetchQueries);
      activitiesChannel = subscribeToActivities(clientId, refreshStats);
    };
    
    setupSubscriptions();
    
    return () => {
      // Clean up all channels
      if (aiAgentsChannel) supabase.removeChannel(aiAgentsChannel);
      if (errorLogsChannel) supabase.removeChannel(errorLogsChannel);
      if (queriesChannel) supabase.removeChannel(queriesChannel);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
    };
  }, [clientId, refreshStats, refetchErrorLogs, refetchQueries]);

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
