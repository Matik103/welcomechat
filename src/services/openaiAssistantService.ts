
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createClientActivityLog } from '@/services/clientActivityService';

// Get environment variables in a way that works in browser environment
const SUPABASE_URL = import.meta.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = import.meta.env.REACT_APP_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

// Create Supabase client with proper import from the project
import { supabase as projectSupabase } from "@/integrations/supabase/client";

interface AssistantResponse {
  message: string;
  error?: string;
}

export class OpenAIAssistantService {
  private openai: OpenAI;
  private clientId: string;
  private threadId: string | null = null;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  private async getAssistantId(): Promise<string | null> {
    try {
      if (!this.clientId) {
        console.error('No client ID provided');
        return null;
      }
      
      const { data, error } = await projectSupabase
        .from('ai_agents')
        .select('assistant_id')
        .eq('client_id', this.clientId)
        .single();

      if (error) {
        console.error('Error fetching assistant ID:', error);
        throw error;
      }
      
      // Log activity for the attempted assistant fetch
      await this.logActivity('Fetched assistant ID', 'system_update');
      
      return data?.assistant_id || null;
    } catch (error) {
      console.error('Error fetching assistant ID:', error);
      return null;
    }
  }

  private async createThread(): Promise<string | null> {
    try {
      const thread = await this.openai.beta.threads.create();
      this.threadId = thread.id;
      
      // Log thread creation
      await this.logActivity('Created new chat thread', 'system_update');
      
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
      
      // Log message added to thread
      await this.logActivity('Added message to thread', 'chat_interaction', {
        message_preview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
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
      
      let retries = 0;
      const maxRetries = 10;
      const retryDelay = 1000;
      
      while (
        (runStatus.status === 'in_progress' || 
         runStatus.status === 'queued' || 
         runStatus.status === 'requires_action') && 
        retries < maxRetries
      ) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        retries++;
      }

      if (runStatus.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(threadId);
        
        if (messages.data.length === 0) {
          console.error('No messages found in thread');
          return null;
        }
        
        const lastMessage = messages.data[0];
        
        if (!lastMessage.content || lastMessage.content.length === 0) {
          console.error('Empty message content');
          return null;
        }
        
        const content = lastMessage.content[0];
        
        if (content.type === 'text') {
          // Log successful response
          await this.logActivity('Received response from assistant', 'chat_interaction');
          return content.text.value;
        }
        return null;
      } else {
        console.error('Run did not complete successfully:', runStatus.status);
        // Log the error
        await this.logActivity(`Run did not complete: ${runStatus.status}`, 'error_logged');
        return null;
      }
    } catch (error) {
      console.error('Error running assistant:', error);
      return null;
    }
  }

  // Helper method to log activities
  private async logActivity(description: string, activityType: string, metadata: Record<string, any> = {}) {
    try {
      await createClientActivityLog(
        this.clientId,
        activityType,
        description,
        { ...metadata, threadId: this.threadId }
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  public async sendMessage(message: string): Promise<AssistantResponse> {
    try {
      if (!message || message.trim() === '') {
        return {
          message: "Please provide a message to send.",
          error: 'Empty message'
        };
      }

      const assistantId = await this.getAssistantId();
      if (!assistantId) {
        await this.logActivity("Failed to find assistant ID", "error_logged");
        return {
          message: "I apologize, but I'm having trouble connecting to our knowledge base at the moment. Please try again later.",
          error: 'Assistant ID not found'
        };
      }

      // Use existing thread if available, otherwise create a new one
      let threadId = this.threadId;
      if (!threadId) {
        threadId = await this.createThread();
        if (!threadId) {
          await this.logActivity("Failed to create thread", "error_logged");
          return {
            message: "I apologize, but I'm having trouble starting a new conversation. Please try again later.",
            error: 'Failed to create thread'
          };
        }
        this.threadId = threadId;
      }

      const messageAdded = await this.addMessageToThread(threadId, message);
      if (!messageAdded) {
        await this.logActivity("Failed to add message to thread", "error_logged");
        return {
          message: "I apologize, but I'm having trouble processing your message. Please try again later.",
          error: 'Failed to add message to thread'
        };
      }

      const response = await this.runAssistant(threadId, assistantId);
      if (!response) {
        await this.logActivity("Failed to get response from assistant", "error_logged");
        return {
          message: "I apologize, but I'm having trouble generating a response. Please try again later.",
          error: 'Failed to get response from assistant'
        };
      }

      return { message: response };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Log the unexpected error
      await this.logActivity(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`, "error_logged");
      return {
        message: "I apologize, but I'm experiencing some technical difficulties. Please try again later.",
        error: 'Unexpected error'
      };
    }
  }
}
