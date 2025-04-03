
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
    
    // Set a timeout for the fetch request
    const timeoutPromise = new Promise<SyncDocumentResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout: OpenAI sync took too long to respond'));
      }, 30000); // 30 second timeout
    });
    
    try {
      // Create a race between the actual request and the timeout
      const syncResult = await Promise.race([
        timeoutPromise,
        (async () => {
          // Convert file to base64
          const fileData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              resolve(base64data.split(',')[1]); // Remove data URL prefix
            };
            reader.readAsDataURL(file);
          });

          // Call the Edge Function with the correct payload format
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
        })()
      ]);
      
      return syncResult;
    } catch (fetchError) {
      console.error('Fetch error in syncDocumentWithOpenAI:', fetchError);
      
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout: OpenAI sync took too long to respond'
        };
      }
      
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
    
    // Call the query-openai-assistant Edge Function
    const { data, error } = await supabase.functions.invoke('query-openai-assistant', {
      body: { client_id: clientId, query }
    });
    
    if (error) {
      console.error('Error querying OpenAI assistant:', error);
      return { 
        answer: "I'm sorry, I encountered an error while processing your question.", 
        error: `Error querying assistant: ${error.message}` 
      };
    }
    
    if (!data || !data.answer) {
      return { 
        answer: "I couldn't generate a proper response. Please try asking a different question.",
        error: data?.error || 'No answer returned from assistant'
      };
    }
    
    return {
      answer: data.answer,
      threadId: data.thread_id
    };
  } catch (error) {
    console.error('Error in getAnswerFromOpenAIAssistant:', error);
    return {
      answer: "I'm sorry, I encountered an error while processing your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
