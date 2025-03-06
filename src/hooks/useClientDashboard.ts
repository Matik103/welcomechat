
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import types
import { ErrorLog, InteractionStats, QueryItem } from "@/types/client-dashboard";

// Import services
import { fetchErrorLogs, subscribeToErrorLogs } from "@/services/errorLogService";
import { fetchQueries, subscribeToQueries } from "@/services/queryService";
import { fetchDashboardStats, subscribeToActivities } from "@/services/statsService";

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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!clientId) return;
    
    // Setup channels for real-time updates
    const errorLogsChannel = subscribeToErrorLogs(clientId, refetchErrorLogs);
    const queriesChannel = subscribeToQueries(clientId, refetchQueries);
    const activitiesChannel = subscribeToActivities(clientId, fetchStats);
    
    return () => {
      if (errorLogsChannel) supabase.removeChannel(errorLogsChannel);
      if (queriesChannel) supabase.removeChannel(queriesChannel);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
    };
  }, [clientId, refetchErrorLogs, refetchQueries]);

  // Function to fetch dashboard stats
  const fetchStats = async () => {
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
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchStats();
    
    const intervalId = setInterval(fetchStats, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [clientId]);

  return {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
    isLoadingStats,
    authError
  };
};
