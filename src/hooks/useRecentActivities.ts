
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import type { Json } from "@/integrations/supabase/types";

export const useRecentActivities = () => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);
  
  // Query recent activities
  const query = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      console.log("Fetching recent activities...");
      
      // First, fetch the activities
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

      // If there are no activities, return empty array
      if (!activities || activities.length === 0) {
        return [];
      }
      
      // Get all unique client IDs
      const clientIds = [...new Set(activities.map(a => a.client_id))].filter(Boolean) as string[];
      
      // If we have client IDs, fetch their names and details
      if (clientIds.length > 0) {
        try {
          // Fetch client details from ai_agents table with richer information
          const { data: agentsData, error: agentsError } = await supabase
            .from("ai_agents")
            .select("client_id, name, client_name, agent_description, settings")
            .in("client_id", clientIds)
            .eq("interaction_type", "config");
          
          if (agentsError) {
            console.error("Error fetching agent data:", agentsError);
          }

          // Map of client info keyed by client_id
          const clientInfoMap: Record<string, any> = {};
          
          // Populate client info map from ai_agents data
          if (agentsData && agentsData.length > 0) {
            agentsData.forEach(agent => {
              if (agent.client_id) {
                const clientId = agent.client_id;
                
                // Initialize or get existing entry
                clientInfoMap[clientId] = clientInfoMap[clientId] || {};
                
                // Update with agent data
                clientInfoMap[clientId] = {
                  ...clientInfoMap[clientId],
                  clientName: agent.client_name || agent.name || null,
                  agentName: agent.name || null,
                  agentDescription: agent.agent_description || null
                };
              }
            });
          }
          
          // Map activities with client information
          return activities.map(activity => {
            // Get client ID or use a placeholder
            const clientId = activity.client_id || '';
            
            // First check if metadata contains client information
            let clientName = null;
            if (activity.metadata && typeof activity.metadata === 'object' && activity.metadata !== null) {
              // Extract client info from metadata
              const metadataObj = activity.metadata as Record<string, any>;
              if (metadataObj.client_name) {
                clientName = String(metadataObj.client_name);
              } else if (metadataObj.name) {
                clientName = String(metadataObj.name);
              }
            }
            
            // Use clientInfoMap if available, otherwise use metadata or fallback
            const clientInfo = clientInfoMap[clientId] || {};
            
            return {
              ...activity,
              client_name: clientInfo.clientName || clientName || (clientId ? `${clientId.substring(0, 6)}` : "System"),
              client_email: clientInfo.email || null,
              agent_name: clientInfo.agentName || null,
              agent_description: clientInfo.agentDescription || null
            };
          });
        } catch (err) {
          console.error("Error processing client details:", err);
        }
      }

      // If all else fails, return activities with client ID as name
      return activities.map(activity => ({
        ...activity,
        client_name: activity.client_id ? `${activity.client_id.substring(0, 8)}` : "System"
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
