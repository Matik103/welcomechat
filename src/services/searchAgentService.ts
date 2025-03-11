
import { supabase } from "@/integrations/supabase/client";

/**
 * Search for similar content in the AI agent database
 * @param clientId Client ID to search within
 * @param agentName Name of the AI agent
 * @param queryEmbedding Vector embedding to search with
 * @param maxResults Maximum number of results to return
 * @param similarityThreshold Minimum similarity threshold (0-1)
 * @returns Array of matching documents with similarity scores
 */
export const searchAgentData = async (
  clientId: string,
  agentName: string,
  queryEmbedding: number[],
  maxResults: number = 5,
  similarityThreshold: number = 0.7
) => {
  if (!clientId || !agentName || !queryEmbedding || !queryEmbedding.length) {
    console.error("Missing required parameters for vector search");
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      'match_ai_agents', 
      {
        client_id_filter: clientId,
        agent_name_filter: agentName,
        query_embedding: queryEmbedding,
        match_count: maxResults,
        filter: { type: 'document' }
      }
    );

    if (error) {
      console.error("Error performing vector search:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception in vector search:", error);
    return [];
  }
};
