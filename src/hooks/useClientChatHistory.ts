
import { ChatInteraction } from "@/types/agent";
import { useChatHistory } from "./useClientChatData";

/**
 * A simple wrapper around useChatHistory for better organization
 */
export const useClientChatHistory = (clientId: string | undefined, limit: number = 10) => {
  const { data: chatHistory = [], isLoading, error, refetch } = useChatHistory(clientId, limit);
  
  return {
    chatHistory,
    isLoading,
    error,
    refetchChatHistory: refetch
  };
};
