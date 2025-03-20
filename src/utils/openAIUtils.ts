
// Utility functions for OpenAI API interactions

/**
 * Creates or updates an OpenAI assistant for a client
 */
export const createOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName?: string
): Promise<string> => {
  try {
    console.log(`Creating/updating OpenAI assistant for client ${clientId}`);
    
    // Call the Supabase Edge Function to create/update the OpenAI assistant
    const response = await fetch('/api/create-openai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription,
        client_name: clientName
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI assistant creation error:', errorData);
      throw new Error(errorData.error || 'Failed to create OpenAI assistant');
    }
    
    const data = await response.json();
    console.log('OpenAI assistant response:', data);
    
    return data.assistant_id;
  } catch (error) {
    console.error('Error in createOpenAIAssistant:', error);
    throw error;
  }
};
