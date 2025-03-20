
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatInteraction } from '@/types/client';
import { getChatSessions, getRecentInteractions } from '@/services/aiInteractionService';

export const useClientChatData = (clientId?: string) => {
  const [agentName, setAgentName] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatInteraction[]>([]);
  const [recentChats, setRecentChats] = useState<ChatInteraction[]>([]);

  // Fetch chat history
  const { data: chatData, isLoading: isLoadingChats, error: chatError, refetch: refetchChats } = useQuery({
    queryKey: ['chatHistory', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await getChatSessions(clientId);
    },
    enabled: !!clientId,
  });

  // Fetch agent name
  const { data: agentData, isLoading: isLoadingAgent } = useQuery({
    queryKey: ['agentName', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error('Error fetching agent name:', error);
        return null;
      }
      
      return data?.name || '';
    },
    enabled: !!clientId,
  });

  // Fetch recent interactions
  const { data: recentData, isLoading: isLoadingRecent, refetch: refetchRecent } = useQuery({
    queryKey: ['recentChats', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await getRecentInteractions(clientId, 5);
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (chatData) {
      setChatHistory(chatData);
    }
  }, [chatData]);

  useEffect(() => {
    if (agentData) {
      setAgentName(agentData);
    }
  }, [agentData]);

  useEffect(() => {
    if (recentData) {
      setRecentChats(recentData);
    }
  }, [recentData]);

  const refreshChatData = async () => {
    await Promise.all([refetchChats(), refetchRecent()]);
  };

  return {
    chatHistory,
    recentChats,
    agentName,
    isLoading: isLoadingChats || isLoadingAgent || isLoadingRecent,
    error: chatError,
    refreshChatData,
  };
};
