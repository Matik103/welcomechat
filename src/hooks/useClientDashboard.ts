
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClientDashboard = () => {
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ["client-dashboard", user?.id],
    queryFn: async () => {
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

      // Check if the table exists for this agent
      const { data, error } = await supabase.functions.invoke("get_table_status", {
        body: { agent_name: clientData.agent_name.toLowerCase().replace(/\s+/g, '_') }
      });

      if (error) {
        throw new Error("Failed to check table status");
      }

      // Get recent interactions
      let recentInteractions = [];
      if (data?.table_exists) {
        // Use rpc for dynamic table querying instead of direct .from() with a string
        const { data: interactionData, error: interactionError } = await supabase.rpc(
          'query_dynamic_table',
          { 
            table_name: clientData.agent_name.toLowerCase().replace(/\s+/g, '_'),
            query_type: 'recent_interactions',
            limit_count: 5
          }
        );

        if (!interactionError && interactionData) {
          recentInteractions = interactionData;
        }
      }

      // Get interaction stats
      const { data: statsData } = await supabase
        .from("interaction_stats")
        .select("*")
        .eq("client_id", clientData.id)
        .single();

      // Get common queries
      const { data: queriesData } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientData.id)
        .order("frequency", { ascending: false })
        .limit(5);

      // Get error logs
      const { data: errorsData } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Get activities
      const { data: activitiesData } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        clientId: clientData.id,
        agentName: clientData.agent_name,
        tableExists: data?.table_exists || false,
        recentInteractions,
        interactionStats: statsData || {
          total: 0,
          successRate: 0,
          averagePerDay: 0
        },
        commonQueries: queriesData || [],
        errorLogs: errorsData || [],
        activities: activitiesData || [],
        isLoadingStats: false,
        isLoadingQueries: false,
        isLoadingErrors: false,
        isLoadingActivities: false
      };
    },
    enabled: !!user,
  });

  // Destructure the query result and provide all needed properties 
  const { data, isLoading, error } = dashboardQuery;

  return {
    // If data exists, spread its properties, otherwise provide defaults
    ...(data || {
      clientId: "",
      agentName: "",
      tableExists: false,
      recentInteractions: [],
      interactionStats: { total: 0, successRate: 0, averagePerDay: 0 },
      commonQueries: [],
      errorLogs: [],
      activities: []
    }),
    // Set loading states
    isLoadingStats: isLoading,
    isLoadingQueries: isLoading,
    isLoadingErrors: isLoading,
    isLoadingActivities: isLoading,
    error
  };
};
