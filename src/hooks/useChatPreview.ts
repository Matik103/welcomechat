
import { useState, useCallback } from 'react';
import { OpenAIAssistantService } from '@/services/openaiAssistantService';
import { createClientActivity } from '@/services/clientActivityService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useChatPreview = (clientId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a cached service instance
  const assistantService = new OpenAIAssistantService(clientId);

  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!content.trim()) {
        return;
      }
      
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      try {
        // Log the user's message as an activity
        await createClientActivity(
          clientId,
          'chat_interaction',
          `User sent: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          { 
            message_type: 'user_message',
            content: content
          }
        );
      } catch (logError) {
        console.error('Error logging user message:', logError);
        // Continue even if logging fails
      }

      // Get response from assistant
      const response = await assistantService.sendMessage(content);
      const assistantContent = response.error 
        ? `Error: ${response.error}. ${response.message}`
        : response.message;

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      try {
        // Log the assistant's response as an activity
        await createClientActivity(
          clientId,
          'chat_interaction',
          `Assistant replied: ${assistantContent.substring(0, 50)}${assistantContent.length > 50 ? '...' : ''}`,
          { 
            message_type: 'assistant_response',
            content: assistantContent,
            has_error: !!response.error
          }
        );
      } catch (logError) {
        console.error('Error logging assistant response:', logError);
        // Continue even if logging fails
      }

      if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
      console.error('Error in sendMessage:', err);
      
      try {
        // Log the error as an activity
        await createClientActivity(
          clientId,
          'error_logged',
          'Error in chat preview',
          { 
            error_message: err.message || String(err),
            component: 'useChatPreview'
          }
        );
      } catch (logError) {
        console.error('Error logging chat error:', logError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assistantService, clientId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
};
