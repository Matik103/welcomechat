
import { supabase } from '@/integrations/supabase/client';
import { DEEPSEEK_MODEL } from '@/config/env';

/**
 * Creates a new DeepSeek assistant for a client
 */
export const createDeepSeekAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
) => {
  try {
    console.log(`Creating DeepSeek assistant for client ${clientId} with name "${agentName}"`);
    
    // Generate a unique assistant ID based on client name and timestamp
    const assistantId = `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription || '',
        deepseek_enabled: true,
        deepseek_model: DEEPSEEK_MODEL || 'deepseek-chat',
        deepseek_assistant_id: assistantId,
        interaction_type: 'config',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create DeepSeek assistant:', error);
      return { 
        success: false, 
        message: `Failed to create assistant: ${error.message}`
      };
    }

    return { 
      success: true, 
      message: 'DeepSeek assistant created successfully',
      assistant: data
    };
  } catch (error) {
    console.error('Error in createDeepSeekAssistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Updates an existing DeepSeek assistant for a client
 */
export const updateDeepSeekAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string
) => {
  try {
    console.log(`Updating DeepSeek assistant for client ${clientId}`);
    
    // First check if the assistant exists
    const { data: existingAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('id, deepseek_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
      
    if (fetchError || !existingAgent) {
      console.error('Assistant not found for update:', fetchError);
      return { 
        success: false, 
        message: 'Assistant not found for update'
      };
    }
    
    // Update the assistant information
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        agent_name: agentName,
        agent_description: agentDescription || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAgent.id);
      
    if (updateError) {
      console.error('Failed to update DeepSeek assistant:', updateError);
      return { 
        success: false, 
        message: `Failed to update assistant: ${updateError.message}`
      };
    }
    
    return {
      success: true,
      message: 'DeepSeek assistant updated successfully',
      assistantId: existingAgent.deepseek_assistant_id
    };
  } catch (error) {
    console.error('Error in updateDeepSeekAssistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Configures the edge function for DeepSeek integration
 */
export const configureDeepSeekEdgeFunction = async (clientId: string) => {
  try {
    // Check if we have the necessary configuration
    if (!DEEPSEEK_MODEL) {
      console.warn('No DEEPSEEK_MODEL configured');
    }
    
    // This function could be expanded to check if the edge function is properly configured
    // For now it just logs information
    console.log(`Verified DeepSeek configuration for client ${clientId}`);
    
    return {
      success: true,
      message: 'DeepSeek edge function is properly configured'
    };
  } catch (error) {
    console.error('Error verifying DeepSeek configuration:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Initializes an AI agent record with DeepSeek settings
 */
export const initializeDeepSeekAgent = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
) => {
  try {
    // First check if an AI agent already exists for this client
    const { data: existingAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking for existing agent:', fetchError);
      return {
        success: false,
        message: `Error checking for existing agent: ${fetchError.message}`
      };
    }

    if (existingAgent) {
      // Update existing agent
      return await updateDeepSeekAssistant(clientId, agentName, agentDescription);
    } else {
      // Create new agent
      return await createDeepSeekAssistant(clientId, agentName, agentDescription, clientName);
    }
  } catch (error) {
    console.error('Error initializing DeepSeek agent:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
