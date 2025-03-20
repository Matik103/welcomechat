
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
    
    // Sanitize input values to prevent SQL errors with quotes
    const sanitizedAgentName = agentName.replace(/"/g, "'");
    const sanitizedAgentDescription = agentDescription.replace(/"/g, "'");
    const sanitizedClientName = clientName ? clientName.replace(/"/g, "'") : undefined;
    
    // Call the Supabase Edge Function to create/update the OpenAI assistant
    const response = await fetch('/api/create-openai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        agent_name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        client_name: sanitizedClientName
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
