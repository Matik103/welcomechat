
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
    // Get the client details to find the agent name
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();

    if (clientError || !client?.agent_name) {
      console.error("Error fetching client data:", clientError);
      throw new Error("Could not determine AI agent name");
    }

    // Use the ai_agents table to get statistics
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, response_time_ms, query_text, created_at, settings")
      .eq("client_id", clientId)
      .eq("name", client.agent_name)
      .eq("interaction_type", "chat_interaction")
      .eq("is_error", false);

    if (error) {
      console.error(`Error fetching data from ai_agents:`, error);
      throw error;
    }

    // Calculate total interactions
    const totalInteractions = data?.length || 0;

    // Calculate active days (unique days when interactions occurred)
    const uniqueDates = new Set();
    if (data && data.length > 0) {
      data.forEach((interaction) => {
        if (interaction.created_at) {
          const dateStr = new Date(interaction.created_at).toDateString();
          uniqueDates.add(dateStr);
        }
      });
    }
    const activeDays = uniqueDates.size;

    // Calculate average response time
    let totalResponseTime = 0;
    let responsesWithTime = 0;
    
    if (data && data.length > 0) {
      data.forEach((interaction) => {
        if (interaction.response_time_ms) {
          totalResponseTime += interaction.response_time_ms;
          responsesWithTime++;
        }
      });
    }
    
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
 * Sets up a real-time subscription for client's AI agent table
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
    // Get the client details to find the agent table name
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();

    if (clientError || !client?.agent_name) {
      console.error("Error fetching client data for subscription:", clientError);
      return null;
    }

    // Set up subscription for the ai_agents table filtered by client_id
    console.log(`Setting up subscription for AI agent with client ID: ${clientId}`);
    
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
