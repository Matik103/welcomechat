
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

/**
 * Synchronizes a document with an OpenAI assistant
 * @param clientId The client ID associated with the document
 * @param file The file to upload to OpenAI
 * @param documentId Optional document ID if already stored
 * @returns Success status and OpenAI file ID if successful
 */
export async function syncDocumentWithOpenAI(
  clientId: string,
  file: File,
  documentId?: number
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    console.log(`Syncing document with OpenAI assistant for client ${clientId}`);
    
    // First, get the OpenAI assistant ID for this client
    const { data: aiAgent, error: agentError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id, name')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (agentError) {
      console.error('Error fetching OpenAI assistant ID:', agentError);
      return {
        success: false,
        error: 'Failed to fetch OpenAI assistant ID'
      };
    }
    
    let assistantId = aiAgent?.openai_assistant_id;
    const agentName = aiAgent?.name || "AI Assistant";
    
    if (!assistantId) {
      console.log('No OpenAI assistant ID found for client, attempting to create one');
      
      // Try to create an assistant if none exists
      try {
        const { data: assistantData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
          body: {
            client_id: clientId,
            agent_name: agentName,
            agent_description: "A helpful assistant that answers questions based on uploaded documents."
          },
        });
        
        if (createError || !assistantData?.assistant_id) {
          console.error('Error creating OpenAI assistant:', createError || 'No assistant ID returned');
          throw new Error(createError?.message || 'Failed to create OpenAI assistant');
        }
        
        console.log('Successfully created OpenAI assistant:', assistantData.assistant_id);
        
        // Use the newly created assistant ID
        assistantId = assistantData.assistant_id;
      } catch (createError) {
        console.error('Error creating OpenAI assistant:', createError);
        return {
          success: false,
          error: 'No OpenAI assistant found and failed to create a new one'
        };
      }
    }
    
    // Now we have an assistant ID, upload the document to it
    console.log(`Uploading document to OpenAI assistant ${assistantId}`);
    
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assistant_id', assistantId);
    
    // Get the Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    // Call the upload file edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file-to-openai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from upload-file-to-openai function:', errorData);
      return {
        success: false,
        error: errorData.error || `Failed to upload document to OpenAI (${response.status})`
      };
    }
    
    const data = await response.json();
    
    console.log('Successfully uploaded file to OpenAI assistant:', data);
    
    // Update the AI agent record with the OpenAI assistant ID and file info
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ 
        openai_assistant_id: assistantId,
        settings: {
          has_documents: true,
          last_document_update: new Date().toISOString()
        }
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (updateError) {
      console.error('Error updating AI agent with assistant ID:', updateError);
      // Continue despite this error, as the file was uploaded successfully
    }

    // Store document content for vector search as a backup access method
    try {
      const { error: docError } = await supabase
        .from('document_content')
        .insert([
          {
            client_id: clientId,
            document_id: documentId || `file_${Date.now()}`,
            content: `Content from ${file.name}`,
            filename: file.name,
            file_type: file.type,
            openai_file_id: data.file_id
          }
        ]);
      
      if (docError) {
        console.error('Error storing document content:', docError);
      }
    } catch (contentError) {
      console.error('Failed to store document content:', contentError);
      // Don't fail the whole operation if just the content storage fails
    }
    
    toast.success('Document uploaded to OpenAI assistant successfully');
    
    return {
      success: true,
      fileId: data.file_id
    };
  } catch (error) {
    console.error('Error syncing document with OpenAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync document with OpenAI'
    };
  }
}

/**
 * Get an answer from an OpenAI assistant based on a document
 * @param clientId The client ID
 * @param query The query to ask
 * @returns The answer from the OpenAI assistant
 */
export async function getAnswerFromOpenAIAssistant(
  clientId: string,
  query: string
): Promise<{ answer: string; error?: string }> {
  try {
    // Call the Supabase Edge Function to get an answer from the OpenAI assistant
    const { data, error } = await supabase.functions.invoke('query-openai-assistant', {
      body: { 
        client_id: clientId,
        query: query
      }
    });
    
    if (error) {
      console.error('Error calling query-openai-assistant function:', error);
      return { 
        answer: "Sorry, I encountered an error while trying to generate an answer.",
        error: error.message
      };
    }
    
    if (!data || !data.answer) {
      console.error('No answer returned from OpenAI assistant:', data?.error || 'Unknown error');
      return { 
        answer: "Sorry, I couldn't generate a response at this time.",
        error: data?.error || 'No answer returned'
      };
    }
    
    return {
      answer: data.answer
    };
  } catch (error) {
    console.error('Error getting answer from OpenAI assistant:', error);
    return { 
      answer: "An error occurred while processing your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
