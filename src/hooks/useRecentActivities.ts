
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

  return query;
};
