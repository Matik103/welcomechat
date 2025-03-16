
import { ChatInteraction } from "@/types/agent";
import { useChatHistory } from "./useClientChatData";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * A hook to get chat history for a specific client with improved error handling and debugging
 */
export const useClientChatHistory = (clientId: string | undefined, limit: number = 10) => {
  const { data: chatHistory = [], isLoading, error, refetch } = useChatHistory(clientId, limit);
  const [debugInfo, setDebugInfo] = useState<{ agentName: string | null, count: number | null }>({
    agentName: null,
    count: null
  });

  // Debug function to verify connection between client and ai_agents
  useEffect(() => {
    const verifyAgentConnection = async () => {
      if (!clientId) return;
      
      try {
        // Get the client's agent name
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("agent_name")
          .eq("id", clientId)
          .single();
          
        if (clientError) {
          console.error("Error fetching client agent name:", clientError);
          return;
        }
        
        // Count how many AI agent entries exist for this client
        const { count, error: countError } = await supabase
          .from("ai_agents")
          .select("*", { count: 'exact', head: true })
          .eq("client_id", clientId);
          
        if (countError) {
          console.error("Error counting client AI agent entries:", countError);
          return;
        }
        
        setDebugInfo({
          agentName: clientData?.agent_name || null,
          count: count
        });
        
        console.log(`Debug info for client ${clientId}:`, {
          agentName: clientData?.agent_name,
          aiAgentCount: count
        });
      } catch (error) {
        console.error("Error verifying agent connection:", error);
      }
    };
    
    verifyAgentConnection();
  }, [clientId]);
  
  return {
    chatHistory,
    isLoading,
    error,
    refetchChatHistory: refetch,
    debug: debugInfo
  };
};
