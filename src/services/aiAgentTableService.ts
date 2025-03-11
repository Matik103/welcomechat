
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
    if (!clientId || !agentName) {
      throw new Error("Client ID and agent name are required");
    }

    // Convert embedding array to string for storage
    const embeddingString = JSON.stringify(embedding);
    
    // Insert directly into the centralized ai_agents table
    const { error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        content: content,
        metadata: metadata,
        embedding: embeddingString
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

/**
 * Search for similar content in the ai_agents table for a specific client and agent
 */
export const searchAiAgentData = async (
  clientId: string,
  agentName: string,
  queryEmbedding: number[],
  matchCount: number = 5,
  filter: any = {}
): Promise<any[]> => {
  try {
    if (!clientId || !agentName) {
      throw new Error("Client ID and agent name are required");
    }

    // Convert query embedding to string
    const queryEmbeddingString = JSON.stringify(queryEmbedding);
    
    // Use the match_ai_agents function to find similar vectors
    const { data, error } = await supabase.rpc(
      'match_ai_agents',
      {
        client_id_filter: clientId,
        agent_name_filter: agentName,
        query_embedding: queryEmbeddingString,
        match_count: matchCount,
        filter: filter
      }
    );
    
    if (error) {
      console.error("Error searching AI agent data:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to search AI agent data:", error);
    return [];
  }
};
