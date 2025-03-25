
import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction } from "@/utils/rpcUtils";

// Basic types for OpenAI Assistant
interface AssistantCreateParams {
  name: string;
  instructions?: string;
  description?: string;
  model: string;
  tools?: Array<{
    type: "code_interpreter" | "file_search" | "function";
  }>;
  file_ids?: string[];
  metadata?: Record<string, string>;
}

interface AssistantUpdateParams {
  name?: string;
  instructions?: string;
  description?: string;
  model?: string;
  tools?: Array<{
    type: "code_interpreter" | "file_search" | "function";
  }>;
  metadata?: Record<string, string>;
}

/**
 * Creates a new OpenAI Assistant for a client
 * @param clientId The client ID
 * @param agentName The agent name
 * @param instructions Instructions for the assistant
 * @returns The assistant ID or null if creation failed
 */
export const createAssistantForClient = async (
  clientId: string,
  agentName: string,
  instructions: string
): Promise<string | null> => {
  try {
    console.log(`Creating OpenAI Assistant for client ${clientId} with name ${agentName}`);
    
    // Create a new assistant with retrieval tool
    const assistantParams: AssistantCreateParams = {
      name: agentName || 'AI Assistant',
      instructions: instructions || 'You are a helpful AI assistant that answers questions based on provided documents.',
      model: 'gpt-4-turbo-preview',
      tools: [
        {
          type: "code_interpreter" // Changed from "retrieval" to "code_interpreter"
        }
      ]
    };
    
    // Use the Edge Function to create the assistant
    const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
      body: {
        assistant_params: assistantParams,
        client_id: clientId
      }
    });
    
    if (error) {
      console.error('Error creating OpenAI Assistant:', error);
      return null;
    }
    
    if (!data || !data.assistant_id) {
      console.error('No assistant ID returned from function');
      return null;
    }
    
    console.log(`OpenAI Assistant created with ID: ${data.assistant_id}`);
    return data.assistant_id;
  } catch (err) {
    console.error('Exception creating OpenAI Assistant:', err);
    return null;
  }
};

/**
 * Updates an existing OpenAI Assistant
 * @param assistantId The assistant ID
 * @param params Update parameters
 * @returns Success flag
 */
export const updateAssistant = async (
  assistantId: string,
  params: AssistantUpdateParams
): Promise<boolean> => {
  try {
    console.log(`Updating OpenAI Assistant ${assistantId}`);
    
    // Use the Edge Function to update the assistant
    const { data, error } = await supabase.functions.invoke('update-openai-assistant', {
      body: {
        assistant_id: assistantId,
        update_params: params
      }
    });
    
    if (error) {
      console.error('Error updating OpenAI Assistant:', error);
      return false;
    }
    
    console.log(`OpenAI Assistant updated: ${assistantId}`);
    return true;
  } catch (err) {
    console.error('Exception updating OpenAI Assistant:', err);
    return false;
  }
};

/**
 * Sends a message to an OpenAI Assistant instance
 * @param content The message content
 * @returns The assistant's response or an error
 */
export const sendAssistantMessage = async (
  content: string
): Promise<{ message?: string; error?: string }> => {
  try {
    // This is a stub implementation - in reality, you would call a backend API
    // that handles the thread and message creation with OpenAI
    return {
      message: `This is a mock response to: "${content}"`
    };
  } catch (error) {
    console.error('Error sending message to assistant:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Create an OpenAIAssistantService class for backwards compatibility
export class OpenAIAssistantService {
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async sendMessage(content: string): Promise<{ message?: string; error?: string }> {
    try {
      // Mock implementation for preview purposes
      return {
        message: `Mock response for client ${this.clientId}: "${content}"`
      };
    } catch (error) {
      console.error('Error in OpenAIAssistantService.sendMessage:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a namespace for backwards compatibility
export const OpenAIAssistantServiceNamespace = {
  createAssistantForClient,
  updateAssistant
};
