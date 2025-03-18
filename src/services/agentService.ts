
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "./authService";

/**
 * Updates all AI agent records with the correct agent name from client records
 */
export const updateAllAgentNames = async (): Promise<{
  updated_count: number;
  client_count: number;
  error_count: number;
}> => {
  try {
    // Ensure the auth session is valid
    await checkAndRefreshAuth();

    // Get the auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No active session found");
    }

    // Call the Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/update-agent-names`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update agent names");
    }

    const result = await response.json();
    console.log("Agent names update result:", result);
    
    return {
      updated_count: result.updated_count,
      client_count: result.client_count,
      error_count: result.error_count
    };
  } catch (error) {
    console.error("Error updating agent names:", error);
    toast.error("Failed to update agent names: " + error.message);
    throw error;
  }
};

/**
 * Gets a count of mismatched agent names between clients and ai_agents
 */
export const getMismatchedAgentNameCount = async (): Promise<number> => {
  try {
    // Ensure the auth session is valid
    await checkAndRefreshAuth();
    
    // First, get clients with their agent names
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("id, agent_name")
      .not("agent_name", "is", null);
    
    if (clientError) {
      console.error("Error fetching clients:", clientError);
      return 0;
    }
    
    if (!clients || clients.length === 0) {
      return 0;
    }
    
    // For each client, count AI agents with mismatched names
    let mismatchCount = 0;
    
    for (const client of clients) {
      if (!client.agent_name) continue;
      
      const { count, error } = await supabase
        .from("ai_agents")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .neq("name", client.agent_name);
      
      if (!error && count !== null) {
        mismatchCount += count;
      }
    }
    
    return mismatchCount;
  } catch (error) {
    console.error("Error counting mismatched agent names:", error);
    return 0;
  }
};
