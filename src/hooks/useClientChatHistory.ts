
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
      
      // Use fetchChatHistory which now queries the ai_agents table
      const data = await fetchChatHistory(clientId);
      setChatHistoryLength(data.length);
      return data;
    },
    enabled: !!clientId,
  });

  // Provide debug info for troubleshooting
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
