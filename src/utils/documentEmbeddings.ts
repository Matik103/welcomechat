
import { supabase } from '@/integrations/supabase/client';

/**
 * Store document embedding in the ai_agents table
 * @param clientId The client ID associated with the document
 * @param documentId The document ID to associate with the embedding
 * @param content The text content to be embedded
 * @param embedding The vector embedding
 * @returns Success status and message
 */
export async function storeDocumentEmbedding(
  clientId: string,
  documentId: number,
  content: string,
  embedding: number[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log(`Storing embedding for document ${documentId} for client ${clientId}`);
    
    // Call the RPC function to store the embedding
    const { data, error } = await supabase.rpc('store_document_embedding', {
      p_client_id: clientId,
      p_document_id: documentId,
      p_content: content,
      p_embedding: embedding
    });
    
    if (error) {
      console.error('Error storing document embedding:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to store document embedding'
      };
    }
    
    return {
      success: true,
      message: 'Document embedding stored successfully'
    };
  } catch (error) {
    console.error('Error in storeDocumentEmbedding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'An unexpected error occurred while storing document embedding'
    };
  }
}

/**
 * Find similar documents based on embedding
 * @param clientId The client ID to search documents for
 * @param queryEmbedding The vector embedding to compare against
 * @param threshold The similarity threshold (0-1, higher is more similar)
 * @param maxResults Maximum number of results to return
 * @returns Array of similar documents with similarity scores
 */
export async function findSimilarDocuments(
  clientId: string,
  queryEmbedding: number[],
  threshold: number = 0.7,
  maxResults: number = 5
): Promise<any[]> {
  try {
    console.log(`Finding similar documents for client ${clientId}`);
    
    // Call the RPC function to match documents
    const { data, error } = await supabase.rpc('match_documents', {
      p_client_id: clientId,
      p_query_embedding: queryEmbedding,
      p_match_threshold: threshold,
      p_match_count: maxResults
    });
    
    if (error) {
      console.error('Error finding similar documents:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in findSimilarDocuments:', error);
    return [];
  }
}
