
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sets up an OpenAI Assistant for a new client by calling the create-openai-assistant Edge Function
 * 
 * @param clientId Client ID 
 * @param agentName Agent name
 * @param agentDescription Agent description
 * @param clientName Client name for the record
 * @returns Promise with the result
 */
export const setupOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string = '',
  clientName: string = ''
): Promise<{ success: boolean; assistantId?: string; error?: string }> => {
  try {
    // Call the Edge Function to create the OpenAI Assistant
    const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription,
        client_name: clientName
      }
    });

    if (error) {
      console.error('Error creating OpenAI Assistant:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    if (!data?.success || !data?.assistant_id) {
      console.error('Failed to create OpenAI Assistant:', data?.error || 'Unknown error');
      return { 
        success: false, 
        error: data?.error || 'Failed to create OpenAI Assistant' 
      };
    }

    console.log('OpenAI Assistant created successfully:', data);
    
    // Also update the ai_agents record with the assistant_id
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ 
        assistant_id: data.assistant_id,
        settings: {
          ...data.settings,
          assistant_id: data.assistant_id
        }
      })
      .eq('id', clientId);
      
    if (updateError) {
      console.error('Error updating AI agent with assistant ID:', updateError);
      // Continue despite this error
    }
    
    return {
      success: true,
      assistantId: data.assistant_id
    };
  } catch (error) {
    console.error('Exception creating OpenAI Assistant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating OpenAI Assistant'
    };
  }
};
