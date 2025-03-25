
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInteractionStats = (timeRange: "1d" | "1m" | "1y" | "all") => {
  return useQuery({
    queryKey: ["interaction-stats", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();

      // Calculate the start date based on the selected time range
      switch (timeRange) {
        case "1d":
          startDate.setDate(now.getDate() - 1);
          break;
        case "1m":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          // For "all", set a very old date
          startDate = new Date(0); // January 1, 1970
      }

      // Get interactions for the selected time period
      // We've changed to use chat_interaction activities from client_activities table
      const { data: currentPeriodInteractions, error: currentError } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction' as any)
        .gte("created_at", startDate.toISOString());

      if (currentError) throw currentError;

      const totalInteractions = currentPeriodInteractions?.length ?? 0;

      // Get total clients for average calculation - using ai_agents with interaction_type=config
      const { data: allClients, error: clientsError } = await supabase
        .from("ai_agents")
        .select("DISTINCT client_id")
        .eq("interaction_type", "config");
      
      if (clientsError) throw clientsError;
      
      const totalClientCount = allClients?.length ?? 0;
      const avgInteractions = totalClientCount > 0 ? Math.round(totalInteractions / totalClientCount) : 0;

      // Calculate previous period for comparison
      // For example, if timeRange is 1 month, previous period is the month before that
      const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      
      const { data: previousInteractions, error: prevError } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction' as any)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      if (prevError) throw prevError;

      const prevTotalInteractions = previousInteractions?.length ?? 0;
      
      // Calculate average interactions for previous period
      const prevAvgInteractions = totalClientCount > 0 ? Math.round(prevTotalInteractions / totalClientCount) : 0;

      // Calculate percentage change, handling edge cases (like division by zero)
      const avgInteractionsChange = prevAvgInteractions === 0
        ? avgInteractions > 0 ? 100 : 0
        : ((avgInteractions - prevAvgInteractions) / prevAvgInteractions * 100);

      return {
        avgInteractions,
        avgInteractionsChange: avgInteractionsChange.toFixed(1),
        totalInteractions,
        // Adding previous period data for potential future UI enhancements
        prevTotalInteractions,
        prevAvgInteractions,
      };
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache data for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};
