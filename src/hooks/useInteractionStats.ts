
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInteractionStats = (timeRange: "1d" | "1m" | "1y" | "all") => {
  return useQuery({
    queryKey: ["interaction-stats", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();

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
          startDate = new Date(0);
      }

      // Get interactions for the selected time period
      const { data: currentPeriodInteractions } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", startDate.toISOString());

      const totalInteractions = currentPeriodInteractions?.length ?? 0;

      // Get total clients for average calculation
      const { data: allClients } = await supabase
        .from("clients")
        .select("*", { count: "exact" })
        .is("deletion_scheduled_at", null);
      
      const totalClientCount = allClients?.length ?? 0;
      const avgInteractions = totalClientCount ? Math.round(totalInteractions / totalClientCount) : 0;

      // Get previous period interactions for comparison
      const previousStartDate = new Date(startDate.getTime() - (startDate.getTime() - now.getTime()));
      const { data: previousInteractions } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      const prevTotalInteractions = previousInteractions?.length ?? 0;
      const prevAvgInteractions = totalClientCount ? Math.round(prevTotalInteractions / totalClientCount) : 0;

      const avgInteractionsChange = prevAvgInteractions === 0
        ? avgInteractions > 0 ? 100 : 0
        : ((avgInteractions - prevAvgInteractions) / prevAvgInteractions * 100);

      return {
        avgInteractions,
        avgInteractionsChange: avgInteractionsChange.toFixed(1),
        totalInteractions,
      };
    },
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};
