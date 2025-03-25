import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

interface AssistantResponse {
  message: string;
  error?: string;
}

export class OpenAIAssistantService {
  private openai: OpenAI;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    });
  }

  private async getAssistantId(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('assistant_id')
        .eq('client_id', this.clientId)
        .single();

      if (error) throw error;
      return data?.assistant_id || null;
    } catch (error) {
      console.error('Error fetching assistant ID:', error);
      return null;
    }
  }

  private async createThread(): Promise<string | null> {
    try {
      const thread = await this.openai.beta.threads.create();
      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }

  private async addMessageToThread(threadId: string, content: string): Promise<boolean> {
    try {
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
      });
      return true;
    } catch (error) {
      console.error('Error adding message to thread:', error);
      return false;
    }
  }

  private async runAssistant(threadId: string, assistantId: string): Promise<string | null> {
    try {
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });

      // Wait for the run to complete
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      if (runStatus.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        const content = lastMessage.content[0];
        
        if (content.type === 'text') {
          return content.text.value;
        }
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error running assistant:', error);
      return null;
    }
  }

  public async sendMessage(message: string): Promise<AssistantResponse> {
    try {
      const assistantId = await this.getAssistantId();
      if (!assistantId) {
        return {
          message: "I apologize, but I'm having trouble connecting to our knowledge base at the moment. Please try again later.",
          error: 'Assistant ID not found'
        };
      }

      const threadId = await this.createThread();
      if (!threadId) {
        return {
          message: "I apologize, but I'm having trouble starting a new conversation. Please try again later.",
          error: 'Failed to create thread'
        };
      }

      const messageAdded = await this.addMessageToThread(threadId, message);
      if (!messageAdded) {
        return {
          message: "I apologize, but I'm having trouble processing your message. Please try again later.",
          error: 'Failed to add message to thread'
        };
      }

      const response = await this.runAssistant(threadId, assistantId);
      if (!response) {
        return {
          message: "I apologize, but I'm having trouble generating a response. Please try again later.",
          error: 'Failed to get response from assistant'
        };
      }

      return { message: response };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        message: "I apologize, but I'm experiencing some technical difficulties. Please try again later.",
        error: 'Unexpected error'
      };
    }
  }
}

export const uploadToOpenAIAssistant = async (
  assistantId: string,
  fileId: string
): Promise<boolean> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    });
    
    // Attach the file to the assistant using the correct API
    await openai.beta.assistants.update(assistantId, {
      file_ids: [fileId]
    });
    
    return true;
  } catch (error) {
    console.error('Error uploading to OpenAI Assistant:', error);
    return false;
  }
};

/**
 * Updates an existing assistant
 * @param assistantId The assistant ID to update
 * @param updates The updates to apply
 * @returns The updated assistant
 */
export const updateAssistant = async (
  assistantId: string,
  updates: {
    name?: string;
    description?: string;
    instructions?: string;
    fileIds?: string[];
    tools?: any[];
    model?: string;
  }
): Promise<any> => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY || "";
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is required");
    }

    // Create the API request options based on what's provided
    const updateParams: any = {};
    
    if (updates.name) updateParams.name = updates.name;
    if (updates.description) updateParams.description = updates.description;
    if (updates.instructions) updateParams.instructions = updates.instructions;
    if (updates.tools) updateParams.tools = updates.tools;
    if (updates.model) updateParams.model = updates.model;
    
    // The fileIds property needs special handling (not directly supported in the current API)
    if (updates.fileIds) {
      updateParams.file_ids = updates.fileIds;
    }

    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "assistants=v1"
      },
      body: JSON.stringify(updateParams)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI Assistant update failed: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error updating assistant:", error);
    throw new Error(error?.message || "Failed to update assistant");
  }
};
