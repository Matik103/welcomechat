
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked: string;
}

export const useClientQueries = (clientId: string | undefined) => {
  const { 
    data: queries = [], 
    isLoading,
    refetch
  } = useQuery({
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
        console.error("Error fetching queries:", error);
        toast.error(`Error fetching queries: ${error.message}`);
        return [];
      }
      
      // Transform the data to match the QueryItem interface
      return (data || []).map((item: any) => ({
        id: item.id,
        query_text: item.query_text,
        frequency: item.frequency,
        last_asked: item.updated_at // Use updated_at as last_asked
      })) as QueryItem[];
    },
    enabled: !!clientId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!clientId) return;
    
    // Subscribe to realtime updates for common_queries
    const queriesChannel = supabase
      .channel('queries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'common_queries',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Common queries changed:', payload);
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(queriesChannel);
    };
  }, [clientId, refetch]);

  return {
    queries,
    isLoading,
  };
};
