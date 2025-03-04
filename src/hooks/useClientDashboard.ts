
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientStats } from "@/types/client";

export interface InteractionStats {
  total: number;
  successRate: number;
  averagePerDay: number;
}

export interface CommonQuery {
  id: string;
  query_text: string;
  frequency: number;
  last_asked: string;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
}

export const useClientDashboard = () => {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["client-stats"],
    queryFn: async (): Promise<ClientStats> => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          id,
          client_name,
          last_active,
          monthly_usage:monthly_usage(month, total_interactions)
        `)
        .order("last_active", { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        totalClients: (data || []).length,
        activeClients: (data || []).filter(c => c.last_active).length,
        totalInteractions: (data || []).reduce((sum, client) => {
          const usage = client.monthly_usage || [];
          return sum + usage.reduce((s, m) => s + (m.total_interactions || 0), 0);
        }, 0),
        recentActivity: (data || []).map(client => ({
          id: client.id,
          name: client.client_name,
          lastActive: client.last_active
        }))
      };
    }
  });

  const { data: interactionStats, isLoading: isLoadingInteractionStats } = useQuery({
    queryKey: ["interaction-stats"],
    queryFn: async (): Promise<InteractionStats> => {
      // Using a direct SQL query via RPC since we don't have an interaction_stats table
      const { data, error } = await supabase
        .rpc('get_interaction_stats');

      if (error) throw error;

      // Ensure data has the correct structure
      return {
        total: data?.total || 0,
        successRate: data?.success_rate || 0,
        averagePerDay: data?.average_per_day || 0
      };
    }
  });

  const { data: commonQueries, isLoading: isLoadingCommonQueries } = useQuery({
    queryKey: ["common-queries"],
    queryFn: async (): Promise<CommonQuery[]> => {
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .order("frequency", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: errorLogs, isLoading: isLoadingErrorLogs } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async (): Promise<ErrorLog[]> => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  return {
    stats,
    interactionStats: interactionStats || { total: 0, successRate: 0, averagePerDay: 0 },
    commonQueries,
    errorLogs,
    isLoading: isLoadingStats || isLoadingInteractionStats || isLoadingCommonQueries || isLoadingErrorLogs
  };
};
