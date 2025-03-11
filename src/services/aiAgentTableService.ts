
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
    if (!clientId || !agentName) {
      console.error("Missing required parameters:", { clientId, agentName });
      throw new Error("Client ID and agent name are required");
    }
    
    console.log(`Creating AI agent in centralized table for client: ${clientId} with agent: ${agentName}`);
    
    // Check if any entries already exist for this client and agent combination
    const { data: existingData, error: checkError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientId)
      .eq('agent_name', agentName)
      .limit(1);
      
    if (checkError) {
      console.error("Error checking existing AI agent entries:", checkError);
      throw checkError;
    }
    
    if (existingData && existingData.length > 0) {
      console.log(`AI agent ${agentName} already exists for client ${clientId}`, existingData);
      return true;
    }
    
    // Create an initial record to establish the client-agent relationship
    const { data: insertData, error: insertError } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        content: 'Agent initialization',
        metadata: {
          type: 'agent_creation',
          timestamp: new Date().toISOString()
        }
      })
      .select();
      
    if (insertError) {
      console.error("Error creating initial AI agent record:", insertError);
      throw insertError;
    }
    
    console.log("Successfully created AI agent record:", insertData);
    return true;
  } catch (error: any) {
    console.error("Failed to set up AI agent in centralized table:", error);
    toast.error(`Error setting up AI agent: ${error.message || String(error)}`);
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

    // Convert embedding array to string for storage if not already a string
    const embeddingString = typeof embedding === 'string' 
      ? embedding 
      : JSON.stringify(embedding);
    
    // Insert directly into the centralized ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        content: content,
        metadata: metadata,
        embedding: embeddingString
      })
      .select();
    
    if (error) {
      console.error(`Error inserting data for agent ${agentName}:`, error);
      throw error;
    }
    
    console.log(`Successfully inserted data for client ${clientId}, agent ${agentName}:`, data);
    return true;
  } catch (error: any) {
    console.error("Failed to insert AI agent data:", error);
    toast.error(`Error inserting AI agent data: ${error.message || String(error)}`);
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
      console.error("Missing required parameters for search:", { clientId, agentName });
      throw new Error("Client ID and agent name are required");
    }

    // Convert query embedding to string if it's not already
    const queryEmbeddingString = typeof queryEmbedding === 'string' 
      ? queryEmbedding 
      : JSON.stringify(queryEmbedding);
    
    console.log(`Searching for similar content with client: ${clientId}, agent: ${agentName}`);
    
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
    
    console.log(`Search results for client ${clientId}, agent ${agentName}:`, data);
    return data || [];
  } catch (error: any) {
    console.error("Failed to search AI agent data:", error);
    return [];
  }
};
