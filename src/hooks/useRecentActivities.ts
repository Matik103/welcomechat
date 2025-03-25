
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { execSql } from "@/utils/rpcUtils";

export const useRecentActivities = () => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  
  // Query recent activities
  const query = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      console.log("Fetching recent activities...");
      
      // Use the SQL function to avoid type issues
      const result = await execSql(`
        SELECT 
          ca.id,
          ca.activity_type,
          ca.description,
          ca.created_at,
          ca.metadata,
          ca.client_id,
          COALESCE(a.name, 'System') as agent_name,
          COALESCE(a.client_name, 'Unknown Client') as client_name,
          a.email as client_email
        FROM 
          client_activities ca
        LEFT JOIN 
          ai_agents a ON ca.client_id = a.client_id AND a.interaction_type = 'config'
        ORDER BY 
          ca.created_at DESC
        LIMIT 15
      `);
      
      if (!result || !Array.isArray(result)) {
        console.error("No activities found or invalid response format");
        return [];
      }
      
      console.log("Found activities:", result.length);
      
      // Format the activities
      return result.map(activity => ({
        id: activity.id,
        activity_type: activity.activity_type,
        description: activity.description,
        created_at: activity.created_at,
        metadata: activity.metadata,
        client_id: activity.client_id,
        client_name: activity.client_name,
        client_email: activity.client_email,
        agent_name: activity.agent_name
      }));
    },
    refetchInterval: 1 * 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
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
