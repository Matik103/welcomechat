
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
    console.log(`Request details: timestamp=${new Date().toISOString()}, clientId=${clientId}`);
    
    // Implement a timeout to prevent hanging requests
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 20000); // 20 second timeout
    
    try {
      // Call the query-openai-assistant Edge Function with improved error handling
      const response = await supabase.functions.invoke('query-openai-assistant', {
        body: { client_id: clientId, query },
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (response.error) {
        console.error('Edge function error:', response.error);
        return { 
          answer: "I'm sorry, I encountered an error while processing your question.", 
          error: `Edge function error: ${response.error.message || JSON.stringify(response.error)}` 
        };
      }
      
      const data = response.data;
      console.log('Response data from Edge Function:', data);
      
      // Handle different response formats from the edge function
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
      } else if (data?.error) {
        // Handle explicit error in the response
        console.error('Error in OpenAI response:', data.error);
        return {
          answer: "I'm sorry, I encountered a specific error: " + data.error,
          error: data.error
        };
      } else if (!data) {
        return {
          answer: "I'm sorry, the AI service is currently unavailable. Please try again later.",
          error: 'No data returned from assistant'
        };
      } else {
        console.warn('Unexpected response format from query-openai-assistant:', data);
        return {
          answer: "I received your question but couldn't generate a proper response.",
          error: 'Unexpected response format'
        };
      }
    } catch (fetchError) {
      // Clear timeout in case of error
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out:', fetchError);
        return {
          answer: "I'm sorry, the request timed out. The service might be experiencing high traffic or connectivity issues.",
          error: 'Request timed out'
        };
      }
      
      // Handle network and other errors
      console.error('Fetch error in getAnswerFromOpenAIAssistant:', fetchError);
      return {
        answer: "I'm sorry, I encountered a network error while processing your question. Please check your connection and try again.",
        error: fetchError instanceof Error ? fetchError.message : String(fetchError)
      };
    }
  } catch (error) {
    console.error('Error in getAnswerFromOpenAIAssistant:', error);
    return {
      answer: "I'm sorry, I encountered an error while processing your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
