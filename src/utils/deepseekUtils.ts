
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Creates or updates a DeepSeek assistant for a client
 */
export const createDeepseekAssistant = async (
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
    
    console.log(`Creating/updating DeepSeek assistant for client ${clientId}`, {
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
    const { data, error } = await supabase.functions.invoke('create-deepseek-assistant', {
      body: {
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription || '',
        client_name: clientName
      }
    });
    
    if (error) {
      console.error('Error creating DeepSeek assistant:', error);
      throw new Error(`Failed to create DeepSeek assistant: ${error.message}`);
    }
    
    if (!data || !data.assistant_id) {
      throw new Error('No assistant ID returned from DeepSeek');
    }
    
    console.log('DeepSeek assistant created successfully:', data.assistant_id);
    
    // Update the AI agent record with the assistant ID
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ 
        deepseek_assistant_id: data.assistant_id,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (updateError) {
      console.error('Error updating AI agent with assistant ID:', updateError);
      // We'll continue despite this error since we still have the assistant ID
    }
    
    return data.assistant_id;
  } catch (error) {
    console.error('Error in createDeepseekAssistant:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create DeepSeek assistant');
    throw error;
  }
};
