
import { supabase } from "@/integrations/supabase/client";
import { InteractionStats } from "@/types/client-dashboard";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches dashboard statistics for a specific client
 */
export const fetchDashboardStats = async (clientId: string): Promise<InteractionStats> => {
  if (!clientId) {
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }

  try {
    // Try to ensure auth is valid before making requests
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    // Default to 0 values if requests fail
    let totalInteractions = 0;
    let activeDays = 0;
    let avgResponseTime = 0;
    let topQueriesList: string[] = [];
    
    try {
      const { count, error: countError } = await supabase
        .from("client_activities")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (!countError) {
        totalInteractions = count || 0;
      }
    } catch (err) {
      console.error("Error counting interactions:", err);
    }

    try {
      const { data: activeDaysData, error: activeDaysError } = await supabase
        .from("client_activities")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (!activeDaysError && activeDaysData) {
        const uniqueDates = new Set();
        activeDaysData.forEach(activity => {
          const activityDate = new Date(activity.created_at).toDateString();
          uniqueDates.add(activityDate);
        });
        activeDays = uniqueDates.size;
      }
    } catch (err) {
      console.error("Error fetching active days:", err);
    }

    try {
      const { data: recentInteractions, error: recentError } = await supabase
        .from("client_activities")
        .select("metadata")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction")
        .order("created_at", { ascending: false })
        .limit(30);
      
      if (!recentError && recentInteractions) {
        let totalResponseTime = 0;
        let countWithResponseTime = 0;
        
        recentInteractions.forEach(interaction => {
          if (interaction.metadata && typeof interaction.metadata === 'object' && 'response_time_ms' in interaction.metadata) {
            totalResponseTime += Number(interaction.metadata.response_time_ms);
            countWithResponseTime++;
          }
        });
        
        avgResponseTime = countWithResponseTime > 0 
          ? Number((totalResponseTime / countWithResponseTime / 1000).toFixed(2))
          : 0;
      }
    } catch (err) {
      console.error("Error fetching recent interactions:", err);
    }

    try {
      const { data: topQueries, error: topQueriesError } = await supabase
        .from("common_queries")
        .select("query_text")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(5);
      
      if (!topQueriesError && topQueries) {
        topQueriesList = topQueries.map(q => q.query_text);
      }
    } catch (err) {
      console.error("Error fetching top queries:", err);
    }

    // Return the stats even if some requests failed
    return {
      total_interactions: totalInteractions,
      active_days: activeDays,
      average_response_time: avgResponseTime,
      top_queries: topQueriesList
    };
    
  } catch (err) {
    console.error("Error fetching stats:", err);
    // Return default values in case of error
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }
};

/**
 * Sets up a real-time subscription for client activities
 */
export const subscribeToActivities = (clientId: string, onUpdate: () => void) => {
  const channel = supabase
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
        onUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
