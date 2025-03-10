
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import types
import { ErrorLog, InteractionStats, QueryItem } from "@/types/client-dashboard";

// Import services
import { fetchErrorLogs, subscribeToErrorLogs } from "@/services/errorLogService";
import { fetchQueries, subscribeToQueries } from "@/services/queryService";
import { fetchDashboardStats, subscribeToAgentData, subscribeToActivities } from "@/services/statsService";

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
      const statsData = await fetchDashboardStats(clientId);
      setStats(statsData);
      setAuthError(false);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      if (err.message === "Authentication failed") {
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
    
    let agentChannel: any = null;
    let errorLogsChannel: any = null;
    let queriesChannel: any = null;
    let activitiesChannel: any = null;
    
    // Setup subscriptions
    const setupSubscriptions = async () => {
      // Subscribe to the AI agent table
      agentChannel = await subscribeToAgentData(clientId, fetchStats);
      
      // Setup other channels
      errorLogsChannel = subscribeToErrorLogs(clientId, refetchErrorLogs);
      queriesChannel = subscribeToQueries(clientId, refetchQueries);
      activitiesChannel = subscribeToActivities(clientId, fetchStats);
    };
    
    setupSubscriptions();
    
    return () => {
      // Clean up all channels
      if (agentChannel) supabase.removeChannel(agentChannel);
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
