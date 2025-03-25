
import { useState, useCallback, useEffect } from 'react';
import { OpenAIAssistantService } from '@/services/openaiAssistantService';
import { createClientActivityLog } from '@/services/clientActivityService';

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
      try {
        console.log('Initializing OpenAIAssistantService with client ID:', clientId);
        setAssistantService(new OpenAIAssistantService(clientId));
        
        // Log when widget is previewed
        const logActivity = async () => {
          try {
            await createClientActivityLog(
              clientId, 
              'widget_previewed', 
              'Widget preview was opened',
              { timestamp: new Date().toISOString() }
            );
          } catch (err) {
            console.error('Error logging widget preview activity:', err);
          }
        };
        
        logActivity();
      } catch (err) {
        console.error('Error initializing OpenAIAssistantService:', err);
        setError('Failed to initialize chat service. Please try again later.');
      }
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
        
        // Log the error
        try {
          await createClientActivityLog(
            clientId,
            'error_logged',
            `Chat error: ${response.error}`,
            { user_message: content }
          );
        } catch (err) {
          console.error('Failed to log chat error:', err);
        }
      } else {
        // Add assistant response
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.message
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Log successful interaction
        try {
          await createClientActivityLog(
            clientId,
            'chat_interaction',
            'Chat interaction completed',
            { 
              query_length: content.length,
              response_length: response.message.length
            }
          );
        } catch (err) {
          console.error('Failed to log chat interaction:', err);
        }
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error in sendMessage:', err);
      
      // Log the unexpected error
      try {
        await createClientActivityLog(
          clientId,
          'error_logged',
          `Unexpected chat error: ${err instanceof Error ? err.message : String(err)}`,
          { user_message: content }
        );
      } catch (logErr) {
        console.error('Failed to log chat error:', logErr);
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
