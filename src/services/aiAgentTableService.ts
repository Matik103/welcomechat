
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Inserts data into the central ai_agents table for a specific client
 * Instead of creating a new table per client, we use the shared ai_agents table
 */
export const createAiAgentTable = async (
  agentName: string,
  clientId: string
): Promise<boolean> => {
  try {
    // No need to create a new table, just log the creation for activity tracking
    console.log(`Using centralized ai_agents table for client: ${clientId} with agent: ${agentName}`);
    
    // For compatibility with existing code, return success
    // The actual data insertion will happen when interacting with the agent
    return true;
  } catch (error) {
    console.error("Failed to set up AI agent in centralized table:", error);
    toast.error(`Error setting up AI agent: ${error.message || error}`);
    return false;
  }
};

/**
 * Inserts vector data into the centralized ai_agents table
 */
export const insertAiAgentData = async (
  clientId: string,
  agentName: string,
  content: string,
  metadata: any,
  embedding: number[]
): Promise<boolean> => {
  try {
    // Insert directly into the centralized ai_agents table
    const { error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        content: content,
        metadata: metadata,
        embedding: embedding
      });
    
    if (error) {
      console.error(`Error inserting data for agent ${agentName}:`, error);
      throw error;
    }
    
    console.log(`Successfully inserted data for client ${clientId}, agent ${agentName}`);
    return true;
  } catch (error) {
    console.error("Failed to insert AI agent data:", error);
    toast.error(`Error inserting AI agent data: ${error.message || error}`);
    return false;
  }
};
