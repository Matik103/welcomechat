
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: string[];
}

export const useClientStats = (clientId: string | undefined) => {
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Query client activities for interaction stats
  const fetchStats = async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      console.log("Fetching stats for client:", clientId);
      
      // Get total interactions count
      const { count: totalInteractions, error: countError } = await supabase
        .from("client_activities")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (countError) {
        console.error("Error getting total interactions:", countError);
        throw countError;
      }

      // Get active days using a direct query instead of RPC
      const { data: activeDaysData, error: activeDaysError } = await supabase
        .from("client_activities")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (activeDaysError) {
        console.error("Error getting active days:", activeDaysError);
        throw activeDaysError;
      }
      
      // Calculate active days by counting distinct dates
      const uniqueDates = new Set();
      activeDaysData?.forEach(activity => {
        const activityDate = new Date(activity.created_at).toDateString();
        uniqueDates.add(activityDate);
      });
      const activeDays = uniqueDates.size;

      // Get response time data from the last 30 interactions
      const { data: recentInteractions, error: recentError } = await supabase
        .from("client_activities")
        .select("metadata")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction")
        .order("created_at", { ascending: false })
        .limit(30);
      
      if (recentError) {
        console.error("Error getting recent interactions:", recentError);
        throw recentError;
      }
      
      // Calculate actual average response time from metadata
      let totalResponseTime = 0;
      let countWithResponseTime = 0;
      
      recentInteractions?.forEach(interaction => {
        if (interaction.metadata && typeof interaction.metadata === 'object' && 'response_time_ms' in interaction.metadata) {
          totalResponseTime += Number(interaction.metadata.response_time_ms);
          countWithResponseTime++;
        }
      });
      
      const avgResponseTime = countWithResponseTime > 0 
        ? (totalResponseTime / countWithResponseTime / 1000).toFixed(2) 
        : 0;

      // Get top query topics
      const { data: topQueries, error: topQueriesError } = await supabase
        .from("common_queries")
        .select("query_text")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(5);
      
      if (topQueriesError) {
        console.error("Error getting top queries:", topQueriesError);
        throw topQueriesError;
      }

      const newStats = {
        total_interactions: totalInteractions || 0,
        active_days: activeDays || 0,
        average_response_time: Number(avgResponseTime),
        top_queries: (topQueries || []).map(q => q.query_text)
      };
      
      console.log("Stats fetched successfully:", newStats);
      setStats(newStats);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to fetch interaction statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (clientId) {
      fetchStats();
      
      // Set up an interval to periodically refresh the data
      const intervalId = setInterval(fetchStats, 15000); // Refresh every 15 seconds
      
      // Subscribe to realtime updates for client_activities
      const activitiesChannel = supabase
        .channel('activities-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_activities',
            filter: `client_id=eq.${clientId}`
          },
          () => {
            fetchStats();
          }
        )
        .subscribe();
      
      return () => {
        clearInterval(intervalId);
        supabase.removeChannel(activitiesChannel);
      };
    } else {
      setIsLoading(false); // No client ID, so we're not loading
    }
  }, [clientId]);

  return {
    stats,
    isLoading,
  };
};
