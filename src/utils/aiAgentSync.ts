
import { supabase } from "@/integrations/supabase/client";
import { createClientActivity } from "@/services/clientActivityService";

/**
 * Syncs AI agents for a given client by copying settings from the 'config' agent
 * to all other agents associated with that client.
 *
 * @param clientId The ID of the client for whom to sync AI agents.
 * @returns A promise that resolves to true if the sync was successful, false otherwise.
 */
export async function syncClientAgents(clientId: string): Promise<boolean> {
  try {
    // Fetch the 'config' AI agent for the client. This agent holds the default settings.
    const { data: configAgent, error: configError } = await supabase
      .from("ai_agents")
      .select("settings")
      .eq("client_id", clientId)
      .eq("interaction_type", "config")
      .single();

    if (configError) {
      console.error("Error fetching config AI agent:", configError);
      return false;
    }

    if (!configAgent?.settings) {
      console.warn("No settings found for config AI agent, skipping sync.");
      return true;
    }

    // Fetch all AI agents for the client that are NOT of type 'config'.
    const { data: agentsToUpdate, error: agentsError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("client_id", clientId)
      .neq("interaction_type", "config");

    if (agentsError) {
      console.error("Error fetching AI agents to update:", agentsError);
      return false;
    }

    // If there are no agents to update, log a message and return.
    if (!agentsToUpdate || agentsToUpdate.length === 0) {
      console.log("No AI agents to update, skipping sync.");
      return true;
    }

    // Extract the IDs of the agents to update.
    const agentIds = agentsToUpdate.map((agent) => agent.id);

    // Update all non-'config' AI agents with the settings from the 'config' agent.
    const { error: updateError } = await supabase
      .from("ai_agents")
      .update({ settings: configAgent.settings })
      .in("id", agentIds);

    if (updateError) {
      console.error("Error updating AI agents:", updateError);
      return false;
    }

    // Log the activity - fixed to pass correct parameters
    console.log(`[ACTIVITY LOG]: Synchronized agents for client ${clientId}`, {
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error("Error syncing client agents:", error);
    return false;
  }
}
