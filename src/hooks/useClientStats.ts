
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ActivityMetadata = {
  success?: boolean;
  [key: string]: any;
};

type ClientActivity = Database["public"]["Tables"]["client_activities"]["Row"] & {
  metadata: ActivityMetadata;
};

export const useClientStats = () => {
  return useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const now = new Date();
      
      // Get total clients (independent of time range)
      const { count: totalClientCount, error: countError } = await supabase
        .from("ai_agents")
        .select("*", { count: "exact", head: true })
        .eq("interaction_type", "config")
        .is("deletion_scheduled_at", null);
      
      if (countError) throw countError;

      // Get active clients (always last 48 hours)
      const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
      const { data: activeClients } = await supabase
        .from("client_activities")
        .select("DISTINCT client_id")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", fortyEightHoursAgo.toISOString());

      const currentActiveCount = activeClients?.length ?? 0;

      // Previous 48-hour window for active clients change calculation
      const previousFortyEightHours = new Date(fortyEightHoursAgo.getTime() - (48 * 60 * 60 * 1000));
      const { data: previousActive } = await supabase
        .from("client_activities")
        .select("DISTINCT client_id")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", previousFortyEightHours.toISOString())
        .lt("created_at", fortyEightHoursAgo.toISOString());

      const previousActiveCount = previousActive?.length ?? 0;
      const activeChangePercentage = previousActiveCount === 0 
        ? currentActiveCount > 0 ? 100 : 0
        : ((currentActiveCount - previousActiveCount) / previousActiveCount * 100);

      // Calculate response rate (last 24 hours)
      const { data: interactions } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", fortyEightHoursAgo.toISOString()) as { data: ClientActivity[] | null };

      const totalInteractions = interactions?.length ?? 0;
      const successfulInteractions = interactions?.filter(i => i.metadata?.success)?.length ?? 0;
      const responseRate = totalInteractions === 0 ? 0 : Math.round((successfulInteractions / totalInteractions) * 100);

      return {
        totalClients: totalClientCount ?? 0,
        activeClients: currentActiveCount,
        activeClientsChange: activeChangePercentage.toFixed(1),
        responseRate,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};
