
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sets up an AI assistant for a client using DeepSeek instead of OpenAI
 */
export const setupOpenAIAssistant = async (clientId: string, agentName: string, agentDescription: string, clientName: string) => {
  try {
    console.log('Setting up AI assistant for:', { clientId, agentName, agentDescription, clientName });
    
    // Update the database to use DeepSeek instead of OpenAI
    const { error } = await supabase
      .from('ai_agents')
      .update({
        agent_name: agentName,
        agent_description: agentDescription,
        deepseek_enabled: true,
        deepseek_model: 'deepseek-chat',
        openai_enabled: false,
        openai_assistant_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (error) {
      console.error('Error updating AI agent settings:', error);
      throw error;
    }
    
    // Log the assistant creation
    console.log(`AI assistant configuration updated successfully`);
    
    return { 
      success: true, 
      message: 'AI assistant configured successfully',
      assistantId: null // No real assistant ID since we're not using OpenAI
    };
  } catch (error) {
    console.error('Error setting up AI assistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set up AI assistant'
    };
  }
};

/**
 * Creates an enhanced system prompt based on the provided description
 */
const createSystemPrompt = (agentDescription: string, clientName: string, agentName: string): string => {
  // Base instructions that apply to all assistants
  const baseInstructions = `
You are ${agentName}, a friendly, helpful assistant for ${clientName}. 

Your primary goal is to provide excellent customer service and assist users with their questions and needs related to ${clientName}.

${agentDescription}`.trim();

  return baseInstructions;
};

/**
 * Configures an AI assistant via Supabase
 */
export const createOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string
): Promise<string> => {
  try {
    console.log(`Configuring AI assistant for client ${clientId}`);
    
    // Sanitize input values to prevent errors with quotes
    const sanitizedAgentName = agentName.replace(/"/g, "'");
    const sanitizedAgentDescription = agentDescription.replace(/"/g, "'");
    
    // Update the database to use DeepSeek instead of OpenAI
    const { error } = await supabase
      .from('ai_agents')
      .update({
        agent_name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        deepseek_enabled: true,
        deepseek_model: 'deepseek-chat',
        openai_enabled: false,
        openai_assistant_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (error) {
      console.error('Error updating AI agent settings:', error);
      throw new Error(`Failed to update AI assistant: ${error.message}`);
    }
    
    // Success notification
    toast.success('AI assistant configured successfully');
    return 'deepseek-configured'; // Return a placeholder ID
  } catch (error) {
    console.error('Error in createOpenAIAssistant:', error);
    toast.error(`AI assistant configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
