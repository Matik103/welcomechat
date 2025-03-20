
import { InteractionStats } from "@/types/client-dashboard";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopQueries } from "./topQueriesService";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { execSql } from "@/utils/rpcUtils";

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
    // Use RPC function via execSql rather than directly querying the clients table
    const agentQuery = `
      SELECT agent_name 
      FROM clients 
      WHERE id = '${clientId}'
      LIMIT 1
    `;
    
    const agentResult = await execSql(agentQuery);
    
    if (!agentResult || agentResult.length === 0) {
      console.error("Could not determine AI agent name");
      throw new Error("Could not determine AI agent name");
    }
    
    const agentName = agentResult[0]?.agent_name || 'AI Assistant';

    // Use RPC function again to get stats
    const statsQuery = `
      SELECT * FROM get_agent_dashboard_stats('${clientId}', '${agentName}')
    `;
    
    const statsResult = await execSql(statsQuery);
    
    if (!statsResult) {
      throw new Error("Failed to retrieve dashboard stats");
    }
    
    // Parse the JSON response from the function
    const stats = typeof statsResult === 'string' 
      ? JSON.parse(statsResult) 
      : statsResult;
    
    // Format the result into the expected structure
    const formattedStats: InteractionStats = {
      total_interactions: Number(stats.total_interactions) || 0,
      active_days: Number(stats.active_days) || 0,
      average_response_time: Number(stats.average_response_time) || 0,
      top_queries: Array.isArray(stats.top_queries) 
        ? stats.top_queries.map((q: any) => ({
            query_text: q.query_text,
            frequency: Number(q.frequency)
          }))
        : []
    };

    return formattedStats;
    
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
    // Get the client details using RPC instead of direct table access
    const agentQuery = `
      SELECT agent_name 
      FROM clients 
      WHERE id = '${clientId}'
      LIMIT 1
    `;
    
    const agentResult = await execSql(agentQuery);
    
    if (!agentResult || agentResult.length === 0) {
      console.error("Error fetching client data for subscription");
      return null;
    }
    
    const agentName = agentResult[0]?.agent_name || 'AI Assistant';

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
