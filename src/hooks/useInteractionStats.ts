
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeDate, safeNumber } from "@/utils/typeUtils";

export function useInteractionStats(clientId: string | undefined) {
  const fetchInteractionStats = async () => {
    if (!clientId) {
      return {
        totalInteractions: 0,
        activeDays: 0,
        averageResponseTime: 0,
        topQueries: []
      };
    }

    try {
      // Get total chat interactions
      const { count: totalInteractions, error: countError } = await supabase
        .from("ai_agents")
        .select("id", { count: "exact", head: false })
        .eq("client_id", clientId)
        .eq("interaction_type", "chat_interaction");

      if (countError) {
        throw countError;
      }

      // Get active days
      const { data: interactionDates, error: datesError } = await supabase
        .from("ai_agents")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("interaction_type", "chat_interaction");

      if (datesError) {
        throw datesError;
      }

      // Get unique days - use safeDate helper to handle null values
      const uniqueDays = new Set(
        interactionDates.map((item) => safeDate(item.created_at).toDateString())
      );
      const activeDays = uniqueDays.size;

      // Get average response time
      const { data: responseTimeData, error: timeError } = await supabase
        .from("ai_agents")
        .select("response_time_ms")
        .eq("client_id", clientId)
        .eq("interaction_type", "chat_interaction")
        .not("response_time_ms", "is", null);

      if (timeError) {
        throw timeError;
      }

      // Use safeNumber to handle nulls
      const totalTimes = responseTimeData.reduce(
        (acc, item) => acc + safeNumber(item.response_time_ms),
        0
      );
      const averageResponseTime =
        responseTimeData.length > 0
          ? totalTimes / responseTimeData.length
          : 0;

      // Get top queries
      const { data: topQueriesData, error: queriesError } = await supabase
        .from("common_queries")
        .select("id, query_text, frequency, created_at")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(5);

      if (queriesError) {
        throw queriesError;
      }

      return {
        totalInteractions: totalInteractions || 0,
        activeDays,
        averageResponseTime,
        topQueries: topQueriesData || []
      };
    } catch (error) {
      console.error("Error fetching interaction stats:", error);
      return {
        totalInteractions: 0,
        activeDays: 0,
        averageResponseTime: 0,
        topQueries: []
      };
    }
  };

  return useQuery({
    queryKey: ["interaction-stats", clientId],
    queryFn: fetchInteractionStats,
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}
