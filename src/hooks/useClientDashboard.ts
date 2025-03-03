
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface InteractionStats {
  total: number;
  successRate: number;
  averagePerDay: number;
}

interface DashboardData {
  clientId: string | null;
  interactionStats: InteractionStats | null;
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
        interactionStats: null,
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
        interactionStats: null,
        commonQueries: [],
        errorLogs: [],
        activities: []
      };
    }

    const clientId = clients[0].id;

    // Calculate interaction stats from client_activities table instead
    // This avoids the type error with a non-existent "interaction_stats" table
    const { data: interactions, error: interactionsError } = await supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", clientId)
      .eq("activity_type", "chat_interaction")
      .order("created_at", { ascending: false })
      .limit(30);

    if (interactionsError) {
      console.error("Error fetching interactions:", interactionsError);
      throw interactionsError;
    }

    // Calculate statistics
    const total = interactions?.length || 0;
    const successfulInteractions = interactions?.filter(i => 
      i.metadata?.status === 'success' || !i.metadata?.status
    ).length || 0;
    const successRate = total > 0 ? Math.round((successfulInteractions / total) * 100) : 0;
    
    // Calculate average per day
    const averagePerDay = total > 0 ? Math.round(total / 30) : 0;

    const interactionStats = {
      total,
      successRate,
      averagePerDay
    };

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
      interactionStats,
      commonQueries: commonQueries || [],
      errorLogs: errorLogs || [],
      activities: activities || []
    };
  };

  const result = useQuery<DashboardData>({
    queryKey: ["clientDashboard", user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user,
  });

  // Provide default values in case data is undefined
  const {
    clientId = null,
    interactionStats = null,
    commonQueries = [],
    errorLogs = [],
    activities = []
  } = result.data || {};

  return {
    clientId,
    interactionStats,
    isLoadingStats: result.isLoading,
    commonQueries,
    isLoadingQueries: result.isLoading,
    errorLogs,
    isLoadingErrors: result.isLoading,
    activities,
    isLoadingActivities: result.isLoading
  };
};
