
import { useChatHistory } from "./useClientChatData";

/**
 * Hook to fetch chat history for a specific client's AI agent
 * This is a wrapper around the useChatHistory hook for backward compatibility
 */
export const useClientChatHistory = (agentName?: string, limit: number = 10) => {
  return useChatHistory(agentName, limit);
};
