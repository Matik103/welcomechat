
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChatHistory } from '@/services/aiInteractionService';
import { ChatInteraction } from '@/types/agent';

export const useClientChatHistory = (clientId: string) => {
  const [chatHistoryLength, setChatHistoryLength] = useState(0);
  
  const {
    data: chatHistory = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['chatHistory', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        const data = await fetchChatHistory(clientId);
        setChatHistoryLength(data.length);
        return data;
      } catch (err) {
        console.error('Error fetching chat history:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const debug = {
    clientId,
    chatHistoryLength
  };

  return {
    chatHistory,
    isLoading,
    error,
    refetch,
    debug
  };
};
