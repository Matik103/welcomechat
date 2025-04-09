
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a DeepSeek assistant for a client
 */
export async function createDeepseekAssistant(
  clientId: string,
  agentName: string,
  agentDescription?: string
) {
  try {
    if (!clientId) {
      throw new Error('Client ID is required to create DeepSeek assistant');
    }
    
    if (!agentName) {
      throw new Error('Agent name is required to create DeepSeek assistant');
    }
    
    console.log(`Creating DeepSeek assistant for client ${clientId} with name "${agentName}"`);
    
    const { data, error } = await supabase.functions.invoke('create-deepseek-assistant', {
      body: {
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription
      }
    });
    
    if (error) {
      console.error('Error creating DeepSeek assistant:', error);
      throw new Error(`Failed to create DeepSeek assistant: ${error.message}`);
    }
    
    if (!data?.success) {
      const errorMessage = data?.error || 'Unknown error';
      console.error('Error response from DeepSeek assistant creation:', errorMessage);
      throw new Error(`Failed to create DeepSeek assistant: ${errorMessage}`);
    }
    
    console.log('DeepSeek assistant created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception creating DeepSeek assistant:', error);
    throw error;
  }
}

/**
 * Queries a DeepSeek assistant
 */
export async function queryDeepseekAssistant(
  clientId: string,
  query: string,
  messages?: Array<{ role: string; content: string }>
) {
  try {
    if (!clientId) {
      throw new Error('Client ID is required to query DeepSeek assistant');
    }
    
    if (!query) {
      throw new Error('Query is required to query DeepSeek assistant');
    }
    
    console.log(`Querying DeepSeek assistant for client ${clientId} with query "${query}"`);
    
    const { data, error } = await supabase.functions.invoke('query-deepseek-assistant', {
      body: {
        client_id: clientId,
        query: query,
        messages: messages
      }
    });
    
    if (error) {
      console.error('Error querying DeepSeek assistant:', error);
      throw new Error(`Failed to query DeepSeek assistant: ${error.message}`);
    }
    
    if (data?.error) {
      console.error('Error response from DeepSeek assistant query:', data.error);
      throw new Error(`Failed to query DeepSeek assistant: ${data.error}`);
    }
    
    console.log('DeepSeek assistant response:', data);
    return data;
  } catch (error) {
    console.error('Exception querying DeepSeek assistant:', error);
    throw error;
  }
}
