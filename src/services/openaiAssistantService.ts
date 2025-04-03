
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';
import { toast } from 'sonner';

interface OpenAIAssistantResponse {
  success: boolean;
  assistantId?: string;
  fileId?: string;
  error?: string;
}

/**
 * Creates or retrieves an OpenAI assistant for a client
 */
export const createOrGetAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string
): Promise<OpenAIAssistantResponse> => {
  try {
    console.log(`Creating or getting OpenAI assistant for client ${clientId}`);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription
      },
    });
    
    if (error) {
      console.error('Error creating/getting OpenAI assistant:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data || !data.assistant_id) {
      return {
        success: false,
        error: 'Failed to create/get assistant'
      };
    }
    
    return {
      success: true,
      assistantId: data.assistant_id
    };
  } catch (error) {
    console.error('Error in createOrGetAssistant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create/get assistant'
    };
  }
};

/**
 * Uploads document content to an OpenAI Assistant
 */
export const uploadToOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  file: File,
  assistantId?: string
): Promise<OpenAIAssistantResponse> => {
  try {
    console.log(`Uploading document to OpenAI assistant for client ${clientId}`);
    
    // If no assistantId is provided, create or get one
    let actualAssistantId = assistantId;
    if (!actualAssistantId) {
      const assistantResult = await createOrGetAssistant(clientId, agentName, 
        `AI Assistant for ${agentName} that helps users with documents and questions.`);
      
      if (!assistantResult.success) {
        return assistantResult;
      }
      
      actualAssistantId = assistantResult.assistantId;
    }
    
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assistant_id', actualAssistantId as string);
    
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
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error uploading file to OpenAI:', data);
      return {
        success: false,
        error: data.error || 'Failed to upload document'
      };
    }
    
    console.log('Successfully uploaded file to OpenAI assistant:', data);
    
    // Update the AI agent record with the OpenAI assistant ID
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ 
        openai_assistant_id: actualAssistantId,
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
    
    toast.success('Document uploaded to OpenAI assistant successfully');
    
    return {
      success: true,
      assistantId: actualAssistantId,
      fileId: data.file_id
    };
  } catch (error) {
    console.error('Error in uploadToOpenAIAssistant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to OpenAI Assistant'
    };
  }
};
