
import { useState, useCallback, useEffect } from 'react';
import { OpenAIAssistantService } from '@/services/openaiAssistantService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useChatPreview = (clientId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantService, setAssistantService] = useState<OpenAIAssistantService | null>(null);

  // Initialize the assistant service when clientId changes
  useEffect(() => {
    if (clientId) {
      setAssistantService(new OpenAIAssistantService(clientId));
    } else {
      console.warn('No client ID provided to useChatPreview');
      setError('No client ID available. Please provide a client ID to use the chat preview.');
      setAssistantService(null);
    }
  }, [clientId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!assistantService) {
      setError('Chat service not available. Please try again later.');
      return;
    }

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
