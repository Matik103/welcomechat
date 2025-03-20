
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChatHistory, useRecentChatInteractions } from "./useClientChatData";

export const useClientDashboard = (clientId?: string) => {
  const { data: chatHistory = [], isLoading: isLoadingChatHistory } = useChatHistory(clientId, 5);
  const { data: recentInteractions = [], isLoading: isLoadingRecentInteractions } = useRecentChatInteractions(clientId, 5);
  
  const [agentName, setAgentName] = useState<string>("");
  const [stats, setStats] = useState<any>({
    totalInteractions: 0,
    totalUsers: 0,
    avgResponseTime: 0,
    topQueries: []
  });
  
  // Fetch agent name and stats
  useEffect(() => {
    if (!clientId) return;
    
    const fetchAgentData = async () => {
      try {
        // Fetch agent name
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();
          
        if (!agentError && agentData) {
          setAgentName(agentData.name || "AI Assistant");
        }
        
        // Fetch stats
        const { data: statsData, error: statsError } = await supabase.rpc(
          'get_agent_dashboard_stats',
          {
            client_id_param: clientId,
            agent_name_param: agentData?.name || null
          }
        );
        
        if (!statsError && statsData) {
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    
    fetchAgentData();
  }, [clientId]);
  
  return {
    agentName,
    stats,
    chatHistory,
    recentInteractions,
    isLoading: isLoadingChatHistory || isLoadingRecentInteractions
  };
};

export default useClientDashboard;
