
// Utility functions for OpenAI API interactions
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Sanitize input values to prevent errors with quotes
    const sanitizedAgentName = agentName.replace(/"/g, "'");
    const sanitizedAgentDescription = agentDescription.replace(/"/g, "'");
    const sanitizedClientName = clientName ? clientName.replace(/"/g, "'") : undefined;
    
    // Call the Supabase Edge Function to create/update the OpenAI assistant
    const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        client_id: clientId,
        agent_name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        client_name: sanitizedClientName,
        thread_capacity: 5 // Configure to remember conversation context
      },
    });
    
    if (error) {
      console.error('OpenAI assistant creation error:', error);
      toast.error('Failed to create OpenAI assistant');
      throw new Error(error.message || 'Failed to create OpenAI assistant');
    }
    
    console.log('OpenAI assistant response:', data);
    
    if (!data || !data.assistant_id) {
      const errorMsg = 'Invalid response from OpenAI assistant creation';
      console.error(errorMsg, data);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Success notification
    toast.success('OpenAI assistant created successfully');
    return data.assistant_id;
  } catch (error) {
    console.error('Error in createOpenAIAssistant:', error);
    toast.error(`OpenAI assistant creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
