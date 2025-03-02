
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Define types for the dashboard data
type InteractionStats = {
  total: number;
  successRate: number;
  averagePerDay: number;
};

type DashboardData = {
  clientId: string;
  agentName: string;
  tableExists: boolean;
  interactionStats: InteractionStats;
  commonQueries: any[];
  errorLogs: any[];
  activities: any[];
};

export const useClientDashboard = () => {
  const { user } = useAuth();

  return useQuery<DashboardData, Error>({
    queryKey: ["client-dashboard", user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the client ID for the current user
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, agent_name")
        .eq("user_id", user.id)
        .single();

      if (clientError) {
        throw new Error("Failed to fetch client data");
      }

      if (!clientData?.agent_name) {
        throw new Error("No agent name found for client");
      }

      // Check if the table exists for this agent using edge function instead of directly querying
      const tableName = clientData.agent_name.toLowerCase().replace(/\s+/g, '_');
      const { data: tableStatusData, error: tableStatusError } = await supabase.functions.invoke("check-table-exists", {
        body: { table_name: tableName }
      });

      if (tableStatusError) {
        console.error("Failed to check table status:", tableStatusError);
        // Continue without throwing, as this isn't critical
      }

      // Default stats
      const defaultStats: InteractionStats = {
        total: 0,
        successRate: 0,
        averagePerDay: 0
      };

      let interactionStats = defaultStats;

      try {
        // Try to get interaction stats
        const { data: statsData } = await supabase.rpc('get_client_stats', {
          client_id_param: clientData.id
        });
        
        if (statsData) {
          interactionStats = {
            total: statsData.total_interactions || 0,
            successRate: statsData.success_rate || 0,
            averagePerDay: statsData.daily_average || 0
          };
        }
      } catch (statsError) {
        console.error("Error fetching interaction stats:", statsError);
        // Continue with default stats
      }

      // Get common queries
      const { data: queriesData, error: queriesError } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientData.id)
        .order("frequency", { ascending: false })
        .limit(5);

      if (queriesError) {
        console.error("Error fetching common queries:", queriesError);
        // Continue without throwing
      }

      // Get error logs
      const { data: errorsData, error: errorsError } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (errorsError) {
        console.error("Error fetching error logs:", errorsError);
        // Continue without throwing
      }

      // Get activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
        // Continue without throwing
      }

      return {
        clientId: clientData.id,
        agentName: clientData.agent_name,
        tableExists: tableStatusData?.table_exists || false,
        interactionStats,
        commonQueries: queriesData || [],
        errorLogs: errorsData || [],
        activities: activitiesData || []
      };
    },
    enabled: !!user,
  });
};
