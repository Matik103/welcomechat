
import { useState, useCallback } from 'react';
import { OpenAIAssistantService } from '@/services/openaiAssistantService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useChatPreview = (clientId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assistantService = new OpenAIAssistantService(clientId);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Get response from assistant
      const response = await assistantService.sendMessage(content);

      if (response.error) {
        setError(response.error);
      } else {
        // Add assistant response
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.message
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error in sendMessage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assistantService]);

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
