
import { supabase } from "@/integrations/supabase/client";

export class OpenAIAssistantService {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Send a message to the OpenAI assistant
   * @param content The message content
   * @returns The assistant's response
   */
  async sendMessage(content: string): Promise<{
    message?: string;
    error?: string;
  }> {
    try {
      console.log(`Sending message to OpenAI assistant for client ${this.clientId}: ${content}`);
      
      // Call the edge function to process the message
      const { data, error } = await supabase.functions.invoke(
        'chat',
        {
          body: {
            client_id: this.clientId,
            message: content
          }
        }
      );
      
      if (error) {
        console.error("Error calling chat function:", error);
        return { error: error.message };
      }
      
      if (!data || !data.response) {
        return { error: "No response received from assistant" };
      }
      
      return { message: data.response };
    } catch (error) {
      console.error("Error in OpenAIAssistantService.sendMessage:", error);
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  }

  /**
   * Get the assistant details
   * @returns The assistant details
   */
  async getAssistantDetails(): Promise<any> {
    try {
      // Query the ai_agents table
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', this.clientId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching assistant details:", error);
      return null;
    }
  }
}

// Export the class and make it the default export
export default OpenAIAssistantService;
