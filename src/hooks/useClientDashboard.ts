
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: string[];
}

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
  client_id: string;
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked: string;
}

export const useClientDashboard = (clientId: string | undefined) => {
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });

  // Query error logs for this client
  const { data: errorLogs = [], isLoading: isLoadingErrorLogs } = useQuery({
    queryKey: ["errorLogs", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        toast.error(`Error fetching error logs: ${error.message}`);
        return [];
      }
      return data as ErrorLog[];
    },
    enabled: !!clientId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query common queries for this client
  const { data: queries = [], isLoading: isLoadingQueries } = useQuery({
    queryKey: ["queries", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(10);

      if (error) {
        toast.error(`Error fetching queries: ${error.message}`);
        return [];
      }
      
      // Transform the data to match the QueryItem interface
      return (data || []).map((item: any) => ({
        id: item.id,
        query_text: item.query_text,
        frequency: item.frequency,
        last_asked: item.updated_at // Use updated_at as last_asked
      })) as QueryItem[];
    },
    enabled: !!clientId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query client activities for interaction stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!clientId) return;

      try {
        // Get total interactions count
        const { count: totalInteractions, error: countError } = await supabase
          .from("client_activities")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("activity_type", "chat_interaction");
        
        if (countError) throw countError;

        // Get active days (count of unique days with chat interactions)
        const { data: activeDaysData, error: activeDaysError } = await supabase
          .rpc("get_active_days_count", { client_id_param: clientId });
        
        const activeDays = activeDaysData || 0;
        
        if (activeDaysError) throw activeDaysError;

        // Get average response time (mock data for now, would need a specific column)
        // In a real implementation, you would calculate this from actual response times
        const avgResponseTime = 2.3;

        // Get top query topics
        const { data: topQueries, error: topQueriesError } = await supabase
          .from("common_queries")
          .select("query_text")
          .eq("client_id", clientId)
          .order("frequency", { ascending: false })
          .limit(5);
        
        if (topQueriesError) throw topQueriesError;

        setStats({
          total_interactions: totalInteractions || 0,
          active_days: activeDays || 0,
          average_response_time: avgResponseTime,
          top_queries: (topQueries || []).map(q => q.query_text)
        });
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        toast.error("Failed to fetch interaction statistics");
      }
    };

    fetchStats();
    // Set up an interval to periodically refresh the data
    const intervalId = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [clientId]);

  return {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
  };
};
