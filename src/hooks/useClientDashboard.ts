
import { useState, useEffect } from "react";
import { useClient } from "./useClient";
import { useAuth } from "@/contexts/AuthContext";
import { useClientChatHistory, useRecentChatInteractions } from "./useClientChatHistory";
import { ChatInteraction } from "@/types/client";

export const useClientDashboard = () => {
  const { user, userRole } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const [isLoading, setIsLoading] = useState(true);
  const [agentName, setAgentName] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  
  // Initialize the client
  const { client, isLoadingClient } = useClient(clientId);
  
  // Fetch chat history using our new hook
  const { 
    chatHistory, 
    isLoading: isLoadingChatHistory 
  } = useClientChatHistory(clientId);
  
  // Fetch recent interactions
  const { 
    recentInteractions, 
    isLoading: isLoadingRecentInteractions 
  } = useRecentChatInteractions(clientId, 5);
  
  // Update the agent name when client data is loaded
  useEffect(() => {
    if (client) {
      setAgentName(client.name || "AI Assistant");
    }
  }, [client]);
  
  // Update loading state
  useEffect(() => {
    setIsLoading(isLoadingClient || isLoadingChatHistory || isLoadingRecentInteractions);
  }, [isLoadingClient, isLoadingChatHistory, isLoadingRecentInteractions]);
  
  return {
    agentName,
    stats,
    chatHistory: chatHistory || [],
    recentInteractions: recentInteractions || [],
    isLoading
  };
};
