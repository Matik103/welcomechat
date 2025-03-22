
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import type { Json } from "@/integrations/supabase/types";
import { execSql } from "@/utils/rpcUtils";

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
          // Fetch client details from ai_agents table for config entries
          const agentDetailsQuery = `
            SELECT 
              client_id, 
              name, 
              settings->>'client_name' as client_name, 
              client_name as direct_client_name,
              email,
              agent_description
            FROM ai_agents
            WHERE client_id = ANY($1::uuid[])
            AND interaction_type = 'config'
          `;
          
          const agentsData = await execSql(agentDetailsQuery, [clientIds]);
          
          // Map of client info keyed by client_id
          const clientInfoMap: Record<string, any> = {};
          
          // Populate client info map from ai_agents data
          if (agentsData && Array.isArray(agentsData) && agentsData.length > 0) {
            agentsData.forEach((agent: any) => {
              if (agent && typeof agent === 'object' && agent.client_id) {
                const clientId = agent.client_id;
                
                // Initialize or get existing entry
                clientInfoMap[clientId] = clientInfoMap[clientId] || {};
                
                // Determine best client name, checking settings->client_name first,
                // then direct client_name field, then agent name as last resort
                const clientName = 
                  (typeof agent.client_name === 'string' ? agent.client_name : null) || 
                  (typeof agent.direct_client_name === 'string' ? agent.direct_client_name : null) || 
                  (typeof agent.name === 'string' ? agent.name : null) || 
                  null;
                
                // Update with agent data
                clientInfoMap[clientId] = {
                  ...clientInfoMap[clientId],
                  clientName: clientName,
                  email: typeof agent.email === 'string' ? agent.email : null,
                  agentName: typeof agent.name === 'string' ? agent.name : null,
                  agentDescription: typeof agent.agent_description === 'string' ? agent.agent_description : null
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
              if (metadataObj.client_name && typeof metadataObj.client_name === 'string') {
                clientName = String(metadataObj.client_name);
              } else if (metadataObj.name && typeof metadataObj.name === 'string') {
                clientName = String(metadataObj.name);
              }
            }
            
            // Use clientInfoMap if available, otherwise use metadata or fallback
            const clientInfo = clientInfoMap[clientId] || {};
            
            return {
              ...activity,
              client_name: clientInfo.clientName || clientName || null,
              client_email: clientInfo.email || null,
              agent_name: clientInfo.agentName || null,
              agent_description: clientInfo.agentDescription || null
            };
          });
        } catch (err) {
          console.error("Error processing client details:", err);
        }
      }

      // If all else fails, return activities with minimal info
      return activities;
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
