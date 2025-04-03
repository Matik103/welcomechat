import { supabase } from '@/integrations/supabase/client';
import { callRpcFunctionSafe } from './rpcUtils';

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
    const { data, error } = await callRpcFunctionSafe(
      'store_document_embedding',
      {
        p_client_id: clientId,
        p_document_id: documentId,
        p_content: content,
        p_embedding: embedding
      }
    );
    
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
    const { data, error } = await callRpcFunctionSafe(
      'match_documents',
      {
        p_client_id: clientId,
        p_query_embedding: queryEmbedding,
        p_match_threshold: threshold,
        p_match_count: maxResults
      }
    );
    
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

/**
 * Generate embedding using OpenAI API via Supabase Edge Function
 * @param text Text to generate embedding for
 * @returns Array of numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Trim and clean the text
    const cleanedText = text.trim().replace(/\n+/g, ' ').slice(0, 8000);
    
    if (!cleanedText) {
      console.error('Empty text for embedding generation');
      return [];
    }
    
    // Call the Supabase Edge Function to generate embedding
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { text: cleanedText }
    });
    
    if (error) {
      console.error('Error calling generate-embeddings function:', error);
      return [];
    }
    
    if (!data || !data.success || !data.embedding) {
      console.error('No embedding data returned from function:', data?.error || 'Unknown error');
      return [];
    }
    
    return data.embedding as number[];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

/**
 * Process document and generate embedding
 * @param clientId Client ID
 * @param documentId Document ID
 * @param text Document text content
 * @returns Result of processing
 */
export async function processDocumentEmbedding(
  clientId: string,
  documentId: number,
  text: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log(`Processing document embedding for client ${clientId}, document ${documentId}`);
    
    // Call the Supabase Edge Function to generate and store embedding
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { 
        text, 
        clientId, 
        documentId 
      }
    });
    
    if (error) {
      console.error('Error calling generate-embeddings function:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate embedding via edge function'
      };
    }
    
    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Unknown error',
        message: 'Failed to process document embedding'
      };
    }
    
    return {
      success: true,
      message: 'Document embedding processed successfully'
    };
  } catch (error) {
    console.error('Error processing document embedding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to process document embedding'
    };
  }
}

/**
 * Search for similar documents based on a query
 * @param clientId The client ID to search documents for
 * @param query The text query to search with
 * @param threshold The similarity threshold (0-1, higher is more similar)
 * @param maxResults Maximum number of results to return
 * @returns Array of similar documents with similarity scores
 */
export async function searchSimilarDocuments(
  clientId: string,
  query: string,
  threshold: number = 0.7,
  maxResults: number = 5
): Promise<any[]> {
  try {
    // Generate the embedding for the user's query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.error('Failed to generate embedding for query');
      return [];
    }
    
    // Find similar documents using the query embedding
    return await findSimilarDocuments(clientId, queryEmbedding, threshold, maxResults);
  } catch (error) {
    console.error('Error searching for similar documents:', error);
    return [];
  }
}
