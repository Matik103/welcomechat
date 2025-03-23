import { supabase } from '@/integrations/supabase/client';

interface OpenAIAssistantResponse {
  success: boolean;
  assistantId?: string;
  fileId?: string;
  error?: string;
}

/**
 * Creates or gets an OpenAI Assistant for a client
 */
export const createOrGetAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string
): Promise<OpenAIAssistantResponse> => {
  try {
    // First check if client already has an assistant
    const { data: existingAssistant, error: queryError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (existingAssistant?.openai_assistant_id) {
      return {
        success: true,
        assistantId: existingAssistant.openai_assistant_id
      };
    }

    // Create new assistant via edge function
    const { data: createData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        clientId,
        agentName,
        agentDescription,
        instructions: `You are ${agentName}, an AI assistant designed to help with questions about the client's documents and data. ${agentDescription}`
      }
    });

    if (createError || !createData?.assistant_id) {
      throw new Error(createError?.message || 'Failed to create OpenAI Assistant');
    }

    // Store the assistant ID in ai_agents
    const { error: updateError } = await supabase
      .from('ai_agents')
      .upsert({
        client_id: clientId,
        name: agentName,
        agent_description: agentDescription,
        interaction_type: 'config',
        openai_assistant_id: createData.assistant_id,
        settings: {
          assistant_type: 'openai',
          created_at: new Date().toISOString(),
          instructions: `You are ${agentName}, an AI assistant designed to help with questions about the client's documents and data. ${agentDescription}`
        }
      });

    if (updateError) {
      console.error('Error storing assistant ID:', updateError);
    }

    return {
      success: true,
      assistantId: createData.assistant_id
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
 * Uploads document content to OpenAI Assistant
 */
export const uploadToOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  content: string,
  title: string
): Promise<OpenAIAssistantResponse> => {
  try {
    // First ensure the client has an assistant
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id, agent_description')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (assistantError || !assistantData?.openai_assistant_id) {
      // Create new assistant if none exists
      const { success, assistantId, error } = await createOrGetAssistant(
        clientId,
        agentName,
        assistantData?.agent_description || `AI Assistant for ${agentName}`
      );

      if (!success || !assistantId) {
        throw new Error(error || 'Failed to create assistant');
      }
    }

    // Upload document to the assistant
    const { data, error } = await supabase.functions.invoke('upload-document-to-assistant', {
      body: {
        clientId,
        agentName,
        documentContent: content,
        documentTitle: title
      }
    });

    if (error) {
      throw error;
    }

    // Log successful upload
    await supabase.from('client_activities').insert({
      client_id: clientId,
      activity_type: 'openai_assistant_document_added',
      description: `Document "${title}" added to OpenAI Assistant`,
      metadata: {
        document_title: title,
        agent_name: agentName,
        openai_file_id: data.file_id,
        openai_assistant_id: data.assistant_id,
        content_length: content.length
      }
    });

    return {
      success: true,
      assistantId: data.assistant_id,
      fileId: data.file_id
    };
  } catch (error) {
    console.error('Error uploading to OpenAI Assistant:', error);
    
    // Log failure
    await supabase.from('client_activities').insert({
      client_id: clientId,
      activity_type: 'openai_assistant_upload_failed',
      description: `Failed to add document "${title}" to OpenAI Assistant`,
      metadata: {
        document_title: title,
        agent_name: agentName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to OpenAI Assistant'
    };
  }
}; 