import { supabase } from '@/integrations/supabase/client';
import type { AIAgentVectorData } from '@/types/supabase';

export interface VectorSearchOptions {
  query: string;
  clientId: string;
  agentName: string;
  similarityThreshold?: number;
  maxResults?: number;
}

export interface VectorInsertOptions {
  content: string;
  clientId: string;
  agentName: string;
  metadata?: Record<string, any>;
}

export async function searchAgentKnowledge({
  query,
  clientId,
  agentName,
  similarityThreshold = 0.7,
  maxResults = 5
}: VectorSearchOptions): Promise<AIAgentVectorData[]> {
  try {
    // First, get the embedding for the query using your embedding service
    const queryEmbedding = await getEmbedding(query);

    // Get the function name for this client/agent
    const { data: functionDetails, error: fnError } = await supabase
      .from('available_agent_functions')
      .select('function_name')
      .eq('client_id', clientId)
      .eq('agent_name', agentName)
      .single();

    if (fnError || !functionDetails) {
      throw new Error(`No matching function found for client ${clientId} and agent ${agentName}`);
    }

    // Use the agent-specific match function
    const { data: documents, error } = await supabase
      .rpc(functionDetails.function_name, {
        query_embedding: queryEmbedding,
        similarity_threshold: similarityThreshold,
        match_count: maxResults
      });

    if (error) throw error;
    return documents || [];
  } catch (error) {
    console.error('Error in vector search:', error);
    throw error;
  }
}

export async function insertAgentKnowledge({
  content,
  clientId,
  agentName,
  metadata = {}
}: VectorInsertOptions): Promise<string> {
  try {
    // Get embedding for the content
    const embedding = await getEmbedding(content);

    // Insert directly into ai_agents table
    const { data: insertedRecord, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        content: content,
        embedding: embedding,
        metadata: metadata
      })
      .select('id')
      .single();

    if (error) throw error;
    return insertedRecord.id;
  } catch (error) {
    console.error('Error inserting vector data:', error);
    throw error;
  }
}

// Placeholder for your embedding function
async function getEmbedding(text: string): Promise<number[]> {
  // Implement your embedding logic here
  throw new Error('Embedding function not implemented');
} 