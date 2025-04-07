
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Creates or updates an AI assistant for a client (now using DeepSeek)
 */
export const createOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription?: string
): Promise<string> => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    
    if (!agentName) {
      throw new Error('Agent name is required');
    }
    
    console.log(`Configuring AI assistant for client ${clientId}`, {
      agent_name: agentName,
      agent_description: agentDescription
    });
    
    // Update the database to use DeepSeek instead of OpenAI
    const { error } = await supabase
      .from('ai_agents')
      .update({
        agent_name: agentName,
        agent_description: agentDescription || '',
        deepseek_enabled: true,
        deepseek_model: 'deepseek-chat',
        openai_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (error) {
      console.error('Error updating AI agent settings:', error);
      throw new Error(`Failed to update AI assistant: ${error.message}`);
    }
    
    console.log('AI assistant configured successfully');
    toast.success('AI assistant configured successfully');
    return 'deepseek-configured'; // Return a placeholder ID
  } catch (error) {
    console.error('Error in createOpenAIAssistant:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to configure AI assistant');
    throw error;
  }
};
