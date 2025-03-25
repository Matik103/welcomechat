
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL } from '@/integrations/supabase/client';

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
      apiKey: import.meta.env.REACT_APP_OPENAI_API_KEY || '',
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
        if (!lastMessage || !lastMessage.content || lastMessage.content.length === 0) {
          return "I'm sorry, I wasn't able to generate a response. Please try again.";
        }
        
        const content = lastMessage.content[0];
        
        if (content.type === 'text') {
          return content.text.value;
        }
        return "I'm sorry, I wasn't able to generate a text response.";
      }

      return "I'm sorry, something went wrong with processing your request.";
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
