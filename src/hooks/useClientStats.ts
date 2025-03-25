
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";

export const useClientStats = () => {
  return useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      try {
        // Get total clients
        const { data: clientData, error: clientError } = await supabase
          .from("ai_agents")
          .select("DISTINCT client_id")
          .eq("interaction_type", "config");

        if (clientError) throw clientError;
        const totalClients = clientData?.length ?? 0;

        // Get count of recently active clients (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentClients, error: recentError } = await supabase
          .from("client_activities")
          .select("DISTINCT client_id")
          .eq("activity_type", "chat_interaction" as ActivityType)
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (recentError) throw recentError;
        const activeClients = recentClients?.length ?? 0;

        // Get active client count from previous 30 day period
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: previousClients, error: prevError } = await supabase
          .from("client_activities")
          .select("DISTINCT client_id")
          .eq("activity_type", "chat_interaction" as ActivityType)
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString());

        if (prevError) throw prevError;
        const prevActiveClients = previousClients?.length ?? 0;

        // Calculate percentage change
        let activeClientsChange = "0";
        if (prevActiveClients > 0) {
          const changePercent = ((activeClients - prevActiveClients) / prevActiveClients) * 100;
          activeClientsChange = changePercent.toFixed(1);
        } else if (activeClients > 0) {
          activeClientsChange = "100"; // If previous is 0 and current is > 0, set 100% increase
        }

        return {
          totalClients,
          activeClients,
          prevActiveClients,
          activeClientsChange,
        };
      } catch (error) {
        console.error("Error fetching client stats:", error);
        // Return default values
        return {
          totalClients: 0,
          activeClients: 0,
          prevActiveClients: 0,
          activeClientsChange: "0",
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};
