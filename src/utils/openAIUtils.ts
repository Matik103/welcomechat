
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Creates or updates an OpenAI assistant for a client
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
    
    console.log(`Creating/updating OpenAI assistant for client ${clientId}`, {
      agent_name: agentName,
      agent_description: agentDescription
    });
    
    // Get client name if available
    const { data: client } = await supabase
      .from('clients')
      .select('client_name')
      .eq('id', clientId)
      .maybeSingle();
    
    const clientName = client?.client_name || '';
    
    // Call the Supabase Edge Function to create the assistant
    const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription || '',
        client_name: clientName
      }
    });
    
    if (error) {
      console.error('Error creating OpenAI assistant:', error);
      throw new Error(`Failed to create OpenAI assistant: ${error.message}`);
    }
    
    if (!data || !data.assistant_id) {
      throw new Error('No assistant ID returned from OpenAI');
    }
    
    console.log('OpenAI assistant created successfully:', data.assistant_id);
    return data.assistant_id;
  } catch (error) {
    console.error('Error in createOpenAIAssistant:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create OpenAI assistant');
    throw error;
  }
};
