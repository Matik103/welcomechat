
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert a document into chunks and generate embeddings
 */
export const processDocumentWithEmbeddings = async (
  documentId: string,
  content: string,
  clientId: string,
  metadata = {}
) => {
  try {
    // Chunk the document content into manageable pieces
    const chunks = chunkDocument(content);
    
    console.log(`Processing document ${documentId} into ${chunks.length} chunks for client ${clientId}`);
    
    // Return early if no chunks were created
    if (!chunks.length) {
      return {
        success: false,
        error: 'No valid content could be extracted from document'
      };
    }

    // Process each chunk with embeddings
    const results = await Promise.allSettled(
      chunks.map(async (chunk, index) => {
        // Generate embedding through the Supabase function
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
          'generate-embeddings',
          {
            body: {
              input: chunk,
              client_id: clientId,
              document_id: documentId,
              chunk_index: index,
              metadata: {
                ...metadata,
                chunk_index: index,
                chunk_count: chunks.length
              }
            }
          }
        );
        
        if (embeddingError) {
          console.error(`Error generating embeddings for chunk ${index}:`, embeddingError);
          throw embeddingError;
        }
        
        return embeddingData;
      })
    );
    
    // Check results
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Document embedding complete. Successfully processed ${successful} chunks, failed: ${failed}`);
    
    return {
      success: true,
      processed: successful,
      failed,
      total: chunks.length
    };
    
  } catch (error) {
    console.error('Error processing document with embeddings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing document'
    };
  }
};

/**
 * Split document into chunks for processing
 */
const chunkDocument = (content: string, maxChunkSize = 1000): string[] => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Clean up content - remove excessive whitespace
  const cleanedContent = content
    .replace(/\s+/g, ' ')
    .trim();
    
  if (cleanedContent.length <= maxChunkSize) {
    return [cleanedContent];
  }
  
  // Split into paragraphs first for more natural chunks
  const paragraphs = cleanedContent.split(/\n+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      // If adding this paragraph exceeds the chunk size
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // If the paragraph itself is too long, split it by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= maxChunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              // If even the sentence is too long, split by words
              const words = sentence.split(/\s+/);
              for (const word of words) {
                if (currentChunk.length + word.length <= maxChunkSize) {
                  currentChunk += (currentChunk ? ' ' : '') + word;
                } else {
                  if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = word;
                  } else {
                    // Word is too long, just add it as a chunk (will exceed size)
                    chunks.push(word);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

/**
 * Match document by vector similarity
 */
export const matchDocumentByVector = async (query: string, clientId: string, limit = 5) => {
  try {
    // Use a stored procedure for vector matching
    const { data, error } = await supabase.rpc(
      'match_documents', 
      {
        query_text: query,
        client_identifier: clientId,
        match_limit: limit
      }
    );
    
    if (error) {
      console.error('Error matching documents by vector:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
    
    return {
      success: true,
      matches: Array.isArray(data) ? data : []
    };
    
  } catch (error) {
    console.error('Error in matchDocumentByVector:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error matching documents',
      matches: []
    };
  }
};

/**
 * Generate an answer from documents based on a query using vector matching
 */
export const generateAnswerFromDocuments = async (clientId: string, query: string) => {
  try {
    console.log(`Generating answer for client ${clientId} with query: "${query}"`);
    
    // First, find relevant document chunks using vector matching
    const { success, matches, error } = await matchDocumentByVector(query, clientId, 5);
    
    if (!success || !Array.isArray(matches) || matches.length === 0) {
      console.log('No relevant documents found for query');
      return {
        success: false,
        answer: "I couldn't find any relevant information to answer your question.",
        error: error || 'No matching documents found'
      };
    }
    
    // Extract content from matches to create context
    const context = matches.map(match => match.content).join('\n\n');
    
    console.log(`Found ${matches.length} relevant document chunks`);
    
    // Use the edge function to generate an answer from the context
    const { data: answerData, error: answerError } = await supabase.functions.invoke(
      'generate-answer',
      {
        body: {
          query,
          context,
          client_id: clientId
        }
      }
    );
    
    if (answerError) {
      console.error('Error generating answer:', answerError);
      return {
        success: false,
        answer: "I'm sorry, I encountered an error while generating an answer.",
        error: answerError.message
      };
    }
    
    if (!answerData || !answerData.answer) {
      return {
        success: false,
        answer: "I'm sorry, I couldn't generate a proper response.",
        error: 'No answer returned from function'
      };
    }
    
    return {
      success: true,
      answer: answerData.answer,
      sources: Array.isArray(matches) ? matches.map(match => ({
        id: match.id,
        similarity: match.similarity,
        metadata: match.metadata
      })) : []
    };
    
  } catch (error) {
    console.error('Error generating answer from documents:', error);
    return {
      success: false,
      answer: "I'm sorry, something went wrong while trying to answer your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
