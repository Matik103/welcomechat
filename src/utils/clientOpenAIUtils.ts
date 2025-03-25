
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";

/**
 * Sets up an OpenAI assistant for a client
 * @param clientId The client ID
 * @param agentName The agent name
 * @param agentDescription The agent description
 * @param clientName The client name
 * @returns The result of the operation
 */
export const setupOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
): Promise<{
  success: boolean;
  message: string;
  assistantId?: string;
}> => {
  try {
    console.log(`Setting up OpenAI assistant for client ${clientId}`);
    
    // Call the edge function to create an OpenAI assistant
    const { data, error } = await supabase.functions.invoke(
      'create-openai-assistant',
      {
        body: {
          client_id: clientId,
          agent_name: agentName,
          agent_description: agentDescription,
          client_name: clientName
        }
      }
    );
    
    if (error) {
      console.error("Error creating OpenAI assistant:", error);
      return {
        success: false,
        message: `Failed to create OpenAI assistant: ${error.message}`
      };
    }
    
    // Log the activity
    await createActivityDirect(
      clientId,
      'client_created' as ActivityType,
      `OpenAI assistant created for ${clientName}`,
      { agent_name: agentName }
    );
    
    return {
      success: true,
      message: "OpenAI assistant created successfully",
      assistantId: data?.assistant_id
    };
  } catch (error) {
    console.error("Error in setupOpenAIAssistant:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
