
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
  client_id: string;
}

export const useClientErrorLogs = (clientId: string | undefined) => {
  const { 
    data: errorLogs = [], 
    isLoading,
    refetch
  } = useQuery({
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
        console.error("Error fetching error logs:", error);
        toast.error(`Error fetching error logs: ${error.message}`);
        return [];
      }
      return data as ErrorLog[];
    },
    enabled: !!clientId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!clientId) return;
    
    // Subscribe to realtime updates for error_logs
    const errorLogsChannel = supabase
      .channel('error-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'error_logs',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Error logs changed:', payload);
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(errorLogsChannel);
    };
  }, [clientId, refetch]);

  return {
    errorLogs,
    isLoading,
  };
};
