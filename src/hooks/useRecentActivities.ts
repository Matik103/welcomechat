
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useRecentActivities = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data: activities, error } = await supabase
        .from("client_activities")
        .select(`
          activity_type,
          description,
          created_at,
          metadata,
          clients:client_id (
            client_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
      }

      return activities.map(activity => ({
        activity_type: activity.activity_type,
        description: activity.description,
        created_at: activity.created_at,
        metadata: activity.metadata,
        client_name: activity.clients?.client_name || "Unknown Client"
      }));
    },
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  // Set up real-time subscription for new activities
  useEffect(() => {
    // Create a subscription to the client_activities table
    const channel = supabase
      .channel('real-time-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_activities'
        },
        (payload) => {
          console.log('New activity received:', payload);
          // When a new activity is inserted, invalidate the query to refetch
          queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
