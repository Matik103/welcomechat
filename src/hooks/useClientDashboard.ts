
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalInteractions: number;
  recentActivity: { id: string; name: string; lastActive: string }[];
}

export interface InteractionStats {
  total: number;
  successRate: number;
  averagePerDay: number;
}

export interface CommonQuery {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string; // Making this optional
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
          const usage = Array.isArray(client.monthly_usage) ? client.monthly_usage : [];
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
      // Using a direct SQL function call
      const { data, error } = await supabase
        .rpc('get_interaction_stats_for_client');

      if (error) throw error;

      // Ensure data has the correct structure
      const result = data as { total: number; success_rate: number; average_per_day: number } || {
        total: 0,
        success_rate: 0,
        average_per_day: 0
      };
      
      return {
        total: result.total || 0,
        successRate: result.success_rate || 0,
        averagePerDay: result.average_per_day || 0
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
      
      // Transform to match CommonQuery interface
      return (data || []).map(item => ({
        id: item.id,
        query_text: item.query_text,
        frequency: item.frequency,
        last_asked: item.updated_at // Use updated_at as last_asked
      }));
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
