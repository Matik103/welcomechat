
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";
import { toast } from "sonner";

interface ChatInteraction {
  id: number;
  content: string;
  metadata: {
    timestamp: string;
    user_message: string;
    type: string;
    client_id?: string;
    success?: boolean;
  };
}

export function useClientDashboard() {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);

  // Get client ID associated with current user
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user) return;

      try {
        const { data: clientInfo, error } = await supabase
          .from("clients")
          .select("id, client_name, agent_name")
          .eq("email", user.email)
          .maybeSingle();

        if (error) {
          console.error("Error fetching client info:", error);
          return;
        }

        if (clientInfo) {
          setClientId(clientInfo.id);
          setClientName(clientInfo.client_name);
          setAgentName(clientInfo.agent_name);
        }
      } catch (error) {
        console.error("Error fetching client info:", error);
      }
    };

    fetchClientInfo();
  }, [user]);

  // Fetch interaction statistics for the chatbot
  const interactionStatsQuery = useQuery({
    queryKey: ["client-interactions", clientId, agentName],
    queryFn: async () => {
      if (!clientId || !agentName) return null;

      // Get last 30 days interactions
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      try {
        // First, check if the table exists using the RPC function
        const { data: tableExists, error: rpcError } = await supabase.rpc(
          "check_table_exists", 
          { table_name: agentName.toLowerCase().replace(/\s+/g, '_') }
        );
        
        if (rpcError) {
          console.error("Error checking table existence:", rpcError);
          throw rpcError;
        }
        
        let interactions: any[] = [];
        let tableName = 'ai_agent'; // Default fallback
        
        if (tableExists) {
          // Use the RPC function to safely query the dynamic table
          const { data: dynamicData, error: dynamicError } = await supabase.rpc(
            "query_agent_table",
            {
              table_name: agentName.toLowerCase().replace(/\s+/g, '_'),
              client_id_param: clientId,
              from_date: thirtyDaysAgo
            }
          );
          
          if (!dynamicError && dynamicData) {
            interactions = dynamicData;
          } else {
            console.log("Error or no data from dynamic table, trying ai_agent table");
          }
        }
        
        // If we couldn't get data from the agent-specific table, try the default ai_agent table
        if (interactions.length === 0) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('ai_agent')
            .select('*')
            .filter('metadata->client_id', 'eq', clientId)
            .gte('metadata->timestamp', thirtyDaysAgo);
            
          if (fallbackError) throw fallbackError;
          interactions = fallbackData || [];
        }
        
        // Calculate success rate
        const totalCount = interactions.length || 0;
        let successCount = 0;
        
        if (interactions && interactions.length > 0) {
          for (const interaction of interactions) {
            if (interaction && 
                typeof interaction === 'object' && 
                interaction.metadata && 
                typeof interaction.metadata === 'object' && 
                interaction.metadata.success) {
              successCount++;
            }
          }
        }
        
        const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;
        
        return {
          total: totalCount,
          successRate: successRate,
          averagePerDay: totalCount > 0 ? Math.round(totalCount / 30) : 0
        };
      } catch (error) {
        console.error("Error in interaction stats query:", error);
        return {
          total: 0,
          successRate: 0,
          averagePerDay: 0
        };
      }
    },
    enabled: !!clientId && !!agentName,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch common queries asked to the chatbot
  const commonQueriesQuery = useQuery({
    queryKey: ["common-queries", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  // Fetch recent error logs
  const errorLogsQuery = useQuery({
    queryKey: ["error-logs", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  return {
    clientId,
    clientName,
    agentName,
    interactionStats: interactionStatsQuery.data,
    isLoadingStats: interactionStatsQuery.isLoading,
    commonQueries: commonQueriesQuery.data,
    isLoadingQueries: commonQueriesQuery.isLoading,
    errorLogs: errorLogsQuery.data,
    isLoadingErrors: errorLogsQuery.isLoading
  };
}
