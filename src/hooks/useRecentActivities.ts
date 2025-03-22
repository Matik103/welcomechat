
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
      const clientIds = [...new Set(activities.map(a => a.client_id))].filter(Boolean);
      
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

          // Also fetch from clients table as a backup source
          const { data: clientsData, error: clientsError } = await supabase
            .from("clients")
            .select("id, client_name, email, agent_name, widget_settings")
            .in("id", clientIds);
            
          if (clientsError) {
            console.error("Error fetching clients data:", clientsError);
          }
          
          // Create a detailed map of client information from both sources
          const clientInfoMap = new Map();
          
          // First populate with clients table data (if available)
          if (clientsData && clientsData.length > 0) {
            clientsData.forEach(client => {
              if (client.id) {
                clientInfoMap.set(client.id, {
                  clientName: client.client_name,
                  email: client.email,
                  agentName: client.agent_name,
                  widgetSettings: client.widget_settings,
                  source: 'clients_table'
                });
              }
            });
          }
          
          // Then enhance/override with ai_agents data (which might be more accurate)
          if (agentsData && agentsData.length > 0) {
            agentsData.forEach(agent => {
              if (agent.client_id) {
                // Get existing client info or create new object
                const existingInfo = clientInfoMap.get(agent.client_id) || {};
                
                // Extract client name from settings if available
                let settingsClientName = null;
                if (agent.settings && typeof agent.settings === 'object') {
                  settingsClientName = agent.settings.client_name;
                }
                
                // Update with agent data, preserving existing fields if not present in agent
                clientInfoMap.set(agent.client_id, {
                  ...existingInfo,
                  clientName: agent.client_name || settingsClientName || existingInfo.clientName,
                  agentName: agent.name || existingInfo.agentName,
                  agentDescription: agent.agent_description || (existingInfo.widgetSettings?.agent_description),
                  source: 'ai_agents_enhanced'
                });
              }
            });
          }
          
          // Map activities with detailed client information
          return activities.map(activity => {
            // First check if metadata contains client information
            let metadataClientInfo = null;
            if (
              activity.metadata && 
              typeof activity.metadata === 'object' && 
              activity.metadata !== null
            ) {
              // Extract client info from metadata
              const metadataObject = activity.metadata as Record<string, any>;
              if ('client_name' in metadataObject) {
                metadataClientInfo = {
                  clientName: String(metadataObject.client_name),
                  source: 'metadata'
                };
              }
            }
            
            // Get client info from map, fallback to metadata, or use exact client ID as last resort
            const clientInfo = clientInfoMap.get(activity.client_id) || metadataClientInfo || {
              clientName: `Client ${activity.client_id.substring(0, 6)}`,
              source: 'id_fallback'
            };
            
            return {
              id: activity.id,
              activity_type: activity.activity_type,
              description: activity.description,
              created_at: activity.created_at,
              metadata: activity.metadata,
              client_id: activity.client_id,
              client_name: clientInfo.clientName,
              client_email: clientInfo.email,
              agent_name: clientInfo.agentName,
              agent_description: clientInfo.agentDescription
            };
          });
        } catch (err) {
          console.error("Error processing client details:", err);
        }
      }

      // If all else fails, return activities with client ID as name
      return activities.map(activity => ({
        ...activity,
        client_name: `Client ${activity.client_id.substring(0, 8)}`
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
