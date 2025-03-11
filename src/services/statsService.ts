
import { InteractionStats } from "@/types/client-dashboard";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopQueries } from "./topQueriesService";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";

/**
 * Fetches dashboard statistics for a specific client
 */
export const fetchDashboardStats = async (clientId: string): Promise<InteractionStats> => {
  if (!clientId) {
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }

  try {
    // Get the client details to find the agent table name
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();

    if (clientError || !client?.agent_name) {
      console.error("Error fetching client data:", clientError);
      throw new Error("Could not determine AI agent name");
    }

    // Use the centralized ai_agents table with client_id and agent_name filters
    const { data, error } = await supabase
      .from('ai_agents')
      .select('metadata, created_at')
      .eq('client_id', clientId)
      .eq('agent_name', client.agent_name)
      .eq('metadata->>type', 'chat_interaction');

    if (error) {
      console.error(`Error fetching data for client ${clientId} with agent ${client.agent_name}:`, error);
      throw error;
    }

    // Ensure the data is an array and process it
    const interactions = Array.isArray(data) ? data : [];

    // Calculate total interactions
    const totalInteractions = interactions.length;

    // Calculate active days (unique days when interactions occurred)
    const uniqueDates = new Set();
    interactions.forEach((interaction: { created_at?: string, metadata?: Json }) => {
      if (interaction.created_at) {
        const dateStr = new Date(interaction.created_at).toDateString();
        uniqueDates.add(dateStr);
      } else if (interaction.metadata && typeof interaction.metadata === 'object' && 'timestamp' in interaction.metadata) {
        const timestamp = interaction.metadata.timestamp;
        if (timestamp && typeof timestamp === 'string') {
          const dateStr = new Date(timestamp).toDateString();
          uniqueDates.add(dateStr);
        }
      }
    });
    const activeDays = uniqueDates.size;

    // Calculate average response time
    let totalResponseTime = 0;
    let responsesWithTime = 0;
    
    interactions.forEach((interaction: { metadata?: Json }) => {
      const metadata = interaction.metadata;
      if (metadata && typeof metadata === 'object' && 'response_time_ms' in metadata) {
        const responseTime = metadata.response_time_ms;
        if (typeof responseTime === 'number' || (typeof responseTime === 'string' && !isNaN(Number(responseTime)))) {
          totalResponseTime += Number(responseTime);
          responsesWithTime++;
        }
      }
    });
    
    const avgResponseTime = responsesWithTime > 0 
      ? Number((totalResponseTime / responsesWithTime / 1000).toFixed(2)) 
      : 0;

    // Fetch top queries
    const topQueriesList = await fetchTopQueries(clientId);

    // Return the combined stats
    return {
      total_interactions: totalInteractions,
      active_days: activeDays,
      average_response_time: avgResponseTime,
      top_queries: topQueriesList
    };
    
  } catch (err) {
    console.error("Error fetching stats:", err);
    // Return default values in case of error
    return {
      total_interactions: 0,
      active_days: 0,
      average_response_time: 0,
      top_queries: []
    };
  }
};

/**
 * Sets up a real-time subscription for client's AI agent data
 * @param clientId - The client ID to subscribe to
 * @param onUpdate - Callback function that will be called when updates occur
 * @returns The subscription channel for cleanup
 */
export const subscribeToAgentData = async (
  clientId: string,
  onUpdate: () => void
): Promise<RealtimeChannel | null> => {
  if (!clientId) {
    console.error("No client ID provided for agent data subscription");
    return null;
  }

  try {
    // Get the client details to find the agent name
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();

    if (clientError || !client?.agent_name) {
      console.error("Error fetching client data for subscription:", clientError);
      return null;
    }
    
    console.log(`Setting up subscription for client ${clientId} with agent ${client.agent_name}`);
    
    // Subscribe to the centralized ai_agents table with filters
    const channel = supabase
      .channel(`agent-data-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log("AI agent data change detected:", payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log(`Subscription to ai_agents for client ${clientId} status:`, status);
      });
      
    return channel;
  } catch (err) {
    console.error("Error setting up agent data subscription:", err);
    return null;
  }
};

// Export the activity subscription functions
export { subscribeToActivities } from "./activitySubscriptionService";
