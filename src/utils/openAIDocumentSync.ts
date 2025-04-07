import { supabase } from '@/integrations/supabase/client';

interface SyncDocumentResult {
  success: boolean;
  fileId?: string;
  assistantFileId?: string;
  error?: string;
  message?: string;
}

interface AnswerResult {
  answer: string;
  threadId?: string;
  error?: string;
}

/**
 * Synchronizes a document with OpenAI assistant for a specific client
 */
export const syncDocumentWithOpenAI = async (
  clientId: string,
  file: File,
  documentId?: string
): Promise<SyncDocumentResult> => {
  try {
    console.log(`Syncing document ${file.name} with OpenAI assistant for client ${clientId}`);
    
    // First, get the OpenAI assistant ID for this client
    const { data: aiAgent, error: agentError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (agentError) {
      console.error('Error fetching OpenAI assistant ID:', agentError);
      return { 
        success: false, 
        error: `Error fetching assistant: ${agentError.message}` 
      };
    }
    
    const assistantId = aiAgent?.openai_assistant_id;
    
    if (!assistantId) {
      console.warn('No OpenAI assistant ID found for client', clientId);
      return { 
        success: false, 
        error: 'No AI assistant configured for this client. Document was still uploaded successfully.' 
      };
    }
    
    console.log(`Found OpenAI assistant ID: ${assistantId}`);
    
    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(file);
      });

      // Call the Edge Function with the file data
      const { data, error } = await supabase.functions.invoke('upload-file-to-openai', {
        body: {
          client_id: clientId,
          file_data: fileData,
          file_name: file.name,
          file_type: file.type
        }
      });
      
      if (error) {
        console.error('Error uploading file to OpenAI:', error);
        return { 
          success: false, 
          error: `Error uploading to OpenAI: ${error.message}` 
        };
      }
      
      console.log('File uploaded to OpenAI successfully:', data);
      
      if (data.document_id) {
        // Update the document record with the OpenAI file ID if we have a document ID
        if (documentId) {
          const { error: updateError } = await supabase
            .from('ai_documents')
            .update({ 
              status: 'completed'
            })
            .eq('id', documentId);
          
          if (updateError) {
            console.error('Error updating document status:', updateError);
            // Non-critical error, we still uploaded the file successfully
          }
        }
        
        return {
          success: true,
          fileId: data.document_id,
          message: 'Document synchronized with OpenAI assistant successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || 'Unknown error from OpenAI file upload'
        };
      }
    } catch (fetchError) {
      console.error('Fetch error in syncDocumentWithOpenAI:', fetchError);
      
      return {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Error connecting to OpenAI'
      };
    }
  } catch (error) {
    console.error('Error in syncDocumentWithOpenAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error syncing document'
    };
  }
};

/**
 * Gets an answer from OpenAI assistant for a specific client
 */
export const getAnswerFromOpenAIAssistant = async (
  clientId: string,
  query: string
): Promise<AnswerResult> => {
  try {
    console.log(`Getting answer from OpenAI assistant for client ${clientId}: "${query}"`);
    
    // Add debug info to help track network issues
    const timestamp = new Date().toISOString();
    console.log(`Request details: timestamp=${timestamp}, clientId=${clientId}`);
    
    // Use Promise with timeout for better error handling
    const fetchWithTimeout = async () => {
      try {
        // Call the query-openai-assistant Edge Function
        const response = await supabase.functions.invoke('query-openai-assistant', {
          body: { 
            client_id: clientId, 
            query,
            timestamp  // Add timestamp for correlation in logs
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.error) {
          console.error('Edge function invocation error:', response.error);
          throw new Error(`Edge function error: ${response.error.message || JSON.stringify(response.error)}`);
        }
        
        return response.data;
      } catch (error) {
        console.error('Edge function fetch error:', error);
        throw error;
      }
    };
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out after 15 seconds'));
      }, 15000);
    });
    
    // Race between the fetch and the timeout
    const data = await Promise.race([fetchWithTimeout(), timeoutPromise]);
    
    console.log('Response data from Edge Function:', data);
    
    // Handle different response formats from the edge function
    if (!data) {
      throw new Error('No data received from Edge Function');
    }
    
    if (data?.error) {
      console.error('Error in Edge Function response:', data.error);
      return {
        answer: "I'm sorry, I encountered a specific error: " + data.error,
        error: data.error
      };
    }
    
    if (data?.answer) {
      return {
        answer: data.answer,
        threadId: data.thread_id
      };
    } else if (typeof data === 'string') {
      return {
        answer: data
      };
    } else if (data?.messages && Array.isArray(data.messages)) {
      const lastMessage = data.messages[data.messages.length - 1]?.content;
      return {
        answer: lastMessage || "I couldn't generate a proper response."
      };
    } else {
      console.warn('Unexpected response format from query-openai-assistant:', data);
      return {
        answer: "I received your question but couldn't generate a proper response.",
        error: 'Unexpected response format'
      };
    }
  } catch (error) {
    console.error('Error in getAnswerFromOpenAIAssistant:', error);
    
    // Provide specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          answer: "I'm sorry, the request timed out. The server might be temporarily unavailable.",
          error: `Request timeout: ${error.message}`
        };
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          answer: "I'm having trouble connecting to my knowledge base. This might be due to network connectivity issues.",
          error: `Network error: ${error.message}`
        };
      } else if (error.message.includes('Edge function')) {
        return {
          answer: "I'm having trouble connecting to my knowledge base. The AI service might be temporarily unavailable.",
          error: error.message
        };
      }
    }
    
    return {
      answer: "I'm sorry, I encountered an error while processing your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
