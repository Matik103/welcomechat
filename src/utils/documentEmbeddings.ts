
import { supabase } from '@/integrations/supabase/client';

interface DocumentSearchResult {
  content: string;
  similarity: number;
  documentId: string;
  metadata?: Record<string, any>;
}

interface AnswerResult {
  answer: string;
  documents?: DocumentSearchResult[];
  error?: string;
}

/**
 * Generates an embedding for a given text using the OpenAI API.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { text }
    });
    
    if (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    
    if (!data || !data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response format');
    }
    
    return data.embedding;
  } catch (error) {
    console.error('Error in generateEmbedding:', error);
    throw error;
  }
};

/**
 * Searches for documents similar to the given query using vector similarity.
 */
export const searchSimilarDocuments = async (
  clientId: string, 
  query: string,
  limit = 5
): Promise<DocumentSearchResult[]> => {
  try {
    // First, generate an embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Then, search for similar documents
    // Convert the embedding array to a string for the RPC function
    const { data, error } = await supabase.rpc('match_documents', {
      p_client_id: clientId,
      p_query_embedding: JSON.stringify(embedding), // Convert the array to a JSON string
      p_match_threshold: 0.5, // Adjust as needed
      p_match_count: limit
    });
    
    if (error) {
      console.error('Error searching for similar documents:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
    
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map(item => ({
      content: item.content || '',
      similarity: item.similarity || 0,
      documentId: item.id || '',
      metadata: item.metadata || {}
    }));
  } catch (error) {
    console.error('Error in searchSimilarDocuments:', error);
    return [];
  }
};

/**
 * Generates an answer based on the given query and related documents.
 */
export const generateAnswerFromDocuments = async (
  clientId: string,
  query: string
): Promise<AnswerResult> => {
  try {
    // Get similar documents
    const similarDocuments = await searchSimilarDocuments(clientId, query);
    
    if (!similarDocuments || similarDocuments.length === 0) {
      return {
        answer: "I don't have enough information to answer that question. Please try asking something else or upload relevant documents.",
        documents: []
      };
    }
    
    // Call the generate-answer function with the query and similar documents
    const { data, error } = await supabase.functions.invoke('generate-answer', {
      body: {
        query,
        documents: similarDocuments
      }
    });
    
    if (error) {
      console.error('Error generating answer:', error);
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
    
    if (!data || !data.answer) {
      throw new Error('Invalid answer response format');
    }
    
    return {
      answer: data.answer,
      documents: similarDocuments
    };
  } catch (error) {
    console.error('Error in generateAnswerFromDocuments:', error);
    return {
      answer: "I'm sorry, I encountered an error while trying to answer your question. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
