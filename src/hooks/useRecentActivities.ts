
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

export const useRecentActivities = () => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  
  // Query recent activities
  const query = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      console.log("Fetching recent activities...");
      
      const { data: activities, error } = await supabase
        .from("client_activities")
        .select(`
          id,
          activity_type,
          description,
          created_at,
          metadata,
          client_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
      }

      console.log("Raw activities data:", activities);
      
      // Fetch client names in a separate query to avoid join issues
      if (activities && activities.length > 0) {
        // Get distinct client IDs
        const clientIds = [...new Set(activities.map(a => a.client_id))];
        
        // Fetch client names
        const { data: clientsData, error: clientsError } = await supabase
          .from("ai_agents")
          .select("client_id, client_name")
          .in("client_id", clientIds)
          .eq("interaction_type", "config");
        
        if (clientsError) {
          console.error("Error fetching client names:", clientsError);
        }
        
        // Create a map of client IDs to names
        const clientNameMap = new Map();
        if (clientsData) {
          clientsData.forEach(client => {
            if (client.client_id && client.client_name) {
              clientNameMap.set(client.client_id, client.client_name);
            }
          });
        }
        
        // Map activities with client names
        return activities.map(activity => ({
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          created_at: activity.created_at,
          metadata: activity.metadata,
          client_id: activity.client_id,
          client_name: clientNameMap.get(activity.client_id) || "Unknown Client"
        }));
      }

      return activities.map(activity => ({
        ...activity,
        client_name: "Unknown Client"
      }));
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // Data stays fresh for 30 seconds
  });

  // Setup realtime subscription only once
  useEffect(() => {
    // Skip if we already have a subscription
    if (subscriptionRef.current) return;
    
    console.log("Setting up realtime subscription for activities");
    
    const channel = supabase
      .channel('recent-activities-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_activities',
      }, (payload) => {
        // Invalidate the cache to trigger a refetch
        console.log("Activity changed in real-time, invalidating query cache:", payload);
        queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
    
    subscriptionRef.current = channel;
    
    return () => {
      console.log("Removing realtime subscription for activities");
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [queryClient]);

  return query;
};
