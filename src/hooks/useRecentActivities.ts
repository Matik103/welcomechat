
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import type { Json } from "@/integrations/supabase/types";
import { execSql } from "@/utils/rpcUtils";
import { ClientActivity } from "@/types/client-dashboard";

export const useRecentActivities = () => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  
  // Query recent activities
  const query = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      console.log("Fetching recent activities...");
      
      try {
        // First, fetch the activities
        const { data: activities, error } = await supabase
          .from("client_activities")
          .select(`
            id,
            activity_type,
            activity_data,
            created_at,
            client_id
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        if (error) {
          console.error("Error fetching activities:", error);
          throw error;
        }

        // If there are no activities, return empty array
        if (!activities || activities.length === 0) {
          return [];
        }
        
        // Get all unique client IDs
        const clientIds = [...new Set(activities.map(a => a.client_id))].filter(Boolean) as string[];
        
        // Prepare mapped activities
        const mappedActivities = activities.map(activity => {
          const activityData = activity.activity_data || {};
          return {
            id: activity.id,
            client_id: activity.client_id || '',
            activity_type: activity.activity_type,
            description: typeof activityData === 'object' && activityData !== null 
              ? ((activityData as Record<string, any>).description || '') 
              : '',
            created_at: activity.created_at,
            metadata: activityData,
            client_name: typeof activityData === 'object' && activityData !== null 
              ? ((activityData as Record<string, any>).client_name || '') 
              : ''
          };
        });
        
        if (clientIds.length > 0) {
          try {
            // Use the same approach as Client Management page - directly query ai_agents
            const { data: clientsData, error: clientsError } = await supabase
              .from('ai_agents')
              .select('client_id, name, settings, client_name, email')
              .in('client_id', clientIds)
              .eq('interaction_type', 'config');
              
            if (clientsError) {
              console.error("Error fetching client info:", clientsError);
            }
            
            // Map of client info keyed by client_id
            const clientInfoMap: Record<string, any> = {};
            
            if (clientsData && Array.isArray(clientsData) && clientsData.length > 0) {
              clientsData.forEach((agent: any) => {
                if (agent && typeof agent === 'object' && agent.client_id) {
                  // Store client info in map
                  clientInfoMap[agent.client_id] = {
                    clientName: agent.client_name || agent.name || null,
                    email: agent.email || null,
                    agentName: agent.name || null
                  };
                }
              });
            }
            
            // Update activities with client info
            return mappedActivities.map(activity => {
              const clientId = activity.client_id || '';
              const clientInfo = clientInfoMap[clientId] || {};
              
              return {
                ...activity,
                client_name: clientInfo.clientName || activity.client_name || (clientId ? clientId : "System"),
                client_email: clientInfo.email || null,
                agent_name: clientInfo.agentName || null
              };
            });
          } catch (err) {
            console.error("Error processing client details:", err);
          }
        }

        return mappedActivities;
      } catch (error) {
        console.error("Error in recent activities query:", error);
        return [];
      }
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
