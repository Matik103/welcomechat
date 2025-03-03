
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Define a clear interface for our returned dashboard data
interface DashboardData {
  clientId: string | null;
  interactionStats: any[];
  commonQueries: any[];
  errorLogs: any[];
  activities: any[];
}

export const useClientDashboard = () => {
  const { user, userRole } = useAuth();

  const fetchDashboardData = async (): Promise<DashboardData> => {
    if (!user) {
      return {
        clientId: null,
        interactionStats: [],
        commonQueries: [],
        errorLogs: [],
        activities: []
      };
    }

    // Get client ID for the authenticated user
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("id, client_name")
      .eq("email", user.email)
      .limit(1);

    if (clientError) {
      console.error("Error fetching client:", clientError);
      throw clientError;
    }

    if (!clients || clients.length === 0) {
      console.warn("No client found for user:", user.email);
      return {
        clientId: null,
        interactionStats: [],
        commonQueries: [],
        errorLogs: [],
        activities: []
      };
    }

    const clientId = clients[0].id;

    // Get interaction stats
    const { data: interactionStats, error: statsError } = await supabase
      .from("interaction_stats")
      .select("*")
      .eq("client_id", clientId)
      .order("date", { ascending: false })
      .limit(30);

    if (statsError) {
      console.error("Error fetching stats:", statsError);
      throw statsError;
    }

    // Get common queries
    const { data: commonQueries, error: queriesError } = await supabase
      .from("common_queries")
      .select("*")
      .eq("client_id", clientId)
      .order("frequency", { ascending: false })
      .limit(10);

    if (queriesError) {
      console.error("Error fetching queries:", queriesError);
      throw queriesError;
    }

    // Get error logs
    const { data: errorLogs, error: logsError } = await supabase
      .from("error_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError) {
      console.error("Error fetching logs:", logsError);
      throw logsError;
    }

    // Get recent activities
    const { data: activities, error: activitiesError } = await supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
      throw activitiesError;
    }

    return {
      clientId,
      interactionStats: interactionStats || [],
      commonQueries: commonQueries || [],
      errorLogs: errorLogs || [],
      activities: activities || []
    };
  };

  const {
    data,
    isLoading: isLoadingAll
  } = useQuery({
    queryKey: ["clientDashboard", user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user,
  });

  // Provide default values in case data is undefined
  const {
    clientId = null,
    interactionStats = [],
    commonQueries = [],
    errorLogs = [],
    activities = []
  } = data || {};

  return {
    clientId,
    interactionStats,
    isLoadingStats: isLoadingAll,
    commonQueries,
    isLoadingQueries: isLoadingAll,
    errorLogs,
    isLoadingErrors: isLoadingAll,
    activities,
    isLoadingActivities: isLoadingAll
  };
};
