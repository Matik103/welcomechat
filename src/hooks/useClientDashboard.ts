
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: string[];
}

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
  client_id: string;
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked: string;
}

export const useClientDashboard = (clientId: string | undefined) => {
  const [stats, setStats] = useState<InteractionStats>({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  });

  const { data: errorLogs = [], isLoading: isLoadingErrorLogs } = useQuery({
    queryKey: ["errorLogs", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        toast.error(`Error fetching error logs: ${error.message}`);
        return [];
      }
      return data as ErrorLog[];
    },
    enabled: !!clientId,
  });

  const { data: queries = [], isLoading: isLoadingQueries } = useQuery({
    queryKey: ["queries", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(10);

      if (error) {
        toast.error(`Error fetching queries: ${error.message}`);
        return [];
      }
      
      // Transform the data to match the QueryItem interface
      return data.map((item: any) => ({
        id: item.id,
        query_text: item.query_text,
        frequency: item.frequency,
        last_asked: item.updated_at // Use updated_at as last_asked
      })) as QueryItem[];
    },
    enabled: !!clientId,
  });

  // Fetch interaction stats from the database or API
  useEffect(() => {
    const fetchStats = async () => {
      if (!clientId) return;

      try {
        // Mock data for now
        setStats({
          total_interactions: 456,
          active_days: 18,
          average_response_time: 2.3,
          top_queries: ["How to use the service?", "Pricing options?", "Support contact?"]
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        toast.error("Failed to fetch interaction statistics");
      }
    };

    fetchStats();
  }, [clientId]);

  return {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
  };
};
