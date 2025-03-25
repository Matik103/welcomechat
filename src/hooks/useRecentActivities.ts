
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ActivityWithClientInfo } from "@/types/activity";

export const formatActivityTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const useRecentActivities = (limit = 20) => {
  return useQuery({
    queryKey: ["recent-activities", limit],
    queryFn: async (): Promise<ActivityWithClientInfo[]> => {
      try {
        // Fetch recent activities
        const { data: activities, error } = await supabase
          .from("client_activities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Error fetching recent activities:", error);
          return [];
        }

        if (!activities || activities.length === 0) {
          return [];
        }

        // Extract unique client IDs
        const clientIds = [...new Set(activities.filter(a => a.client_id).map(a => a.client_id))];

        // If no client IDs, return activities as is
        if (clientIds.length === 0) {
          return activities.map(activity => ({
            ...activity,
            client_name: "Unknown Client",
          }));
        }

        // Fetch client info for these IDs
        const { data: clientInfo, error: clientError } = await supabase
          .from("ai_agents")
          .select("client_id, name")
          .in("client_id", clientIds)
          .eq("interaction_type", "config"); // Only get config entries

        if (clientError) {
          console.error("Error fetching client info:", clientError);
          // Still return activities but without client names
          return activities.map(activity => ({
            ...activity,
            client_name: "Unknown Client",
          }));
        }

        // Create a map of client IDs to names
        const clientNameMap: Record<string, string> = {};
        if (clientInfo) {
          clientInfo.forEach(client => {
            if (client.client_id) {
              clientNameMap[client.client_id] = client.name || "Unnamed Client";
            }
          });
        }

        // Map activities to include client name
        return activities.map(activity => {
          // Extract metadata values if available
          const queryText = activity.activity_data?.query_text || activity.metadata?.query_text || "";
          const responseTime = activity.activity_data?.response_time_ms || activity.metadata?.response_time_ms;
          
          // Get agent name from metadata if available
          const agentName = activity.activity_data?.agent_name || activity.metadata?.agent_name;
          
          // Get client name from map or use default
          const clientName = activity.client_id ? 
            clientNameMap[activity.client_id] || "Unnamed Client" : 
            "System";

          return {
            ...activity,
            client_name: clientName,
            agent_name: agentName,
            query_text: queryText,
            response_time: responseTime,
          };
        });
      } catch (error) {
        console.error("Error in useRecentActivities:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
