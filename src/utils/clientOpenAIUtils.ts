
import { supabase } from "@/integrations/supabase/client";

/**
 * Set up an OpenAI assistant for a client
 * @param clientId The client ID
 * @param agentName The agent name
 * @param agentDescription The agent description
 * @param clientName The client name
 * @returns The response data
 */
export const setupOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
): Promise<any> => {
  try {
    // Call the create-openai-assistant edge function
    const { data, error } = await supabase.functions.invoke(
      'create-openai-assistant',
      {
        body: {
          client_id: clientId,
          agent_name: agentName || "AI Assistant",
          agent_description: agentDescription || "",
          client_name: clientName
        }
      }
    );
    
    if (error) {
      console.error("Failed to create OpenAI assistant:", error);
      throw error;
    }
    
    console.log("OpenAI assistant created:", data);
    return data;
  } catch (error) {
    console.error("Error creating OpenAI assistant:", error);
    // Don't throw, as this is a non-critical operation
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
