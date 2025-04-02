
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientActivity } from "@/types/activity";

export function useRecentActivities() {
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data as ClientActivity[];
    },
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    refetch,
  };
}
