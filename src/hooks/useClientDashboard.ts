
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";

export function useClientDashboard() {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);

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

        if (clientInfo) {
          setClientId(clientInfo.id);
        }
      } catch (error) {
        console.error("Error fetching client info:", error);
      }
    };

    fetchClientInfo();
  }, [user]);

  // Fetch interaction statistics for the chatbot
  const interactionStatsQuery = useQuery({
    queryKey: ["client-interactions", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      // Get last 30 days interactions
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      // Get interactions based on agent type
      const { data: clientData } = await supabase
        .from("clients")
        .select("agent_name")
        .eq("id", clientId)
        .single();
      
      if (!clientData?.agent_name) return null;
      
      try {
        // Try to get the agent-specific table name
        const agentName = clientData.agent_name.toLowerCase().replace(/\s+/g, '_');
        
        // Check if the table exists using a safe approach
        let tableName = 'ai_agent'; // Default fallback table
        
        // Query for interactions in the past 30 days
        // Instead of dynamic table names, we'll try different options
        let interactions;
        let error;
        
        // First try with the specific agent table if it appears to exist
        try {
          // Check if the agent table exists by running a simple query
          const { data: tableCheck } = await supabase.rpc('check_table_exists', { 
            table_name: agentName 
          });
          
          // If the table exists, query it
          if (tableCheck) {
            // Use explicit as any casting only for the dynamic table name
            const result = await supabase
              .from(agentName as any)
              .select('*')
              .eq('metadata->>client_id', clientId)
              .gte('created_at', thirtyDaysAgo);
              
            if (!result.error) {
              interactions = result.data;
            }
          }
        } catch (e) {
          console.log("Agent-specific table not found, falling back to ai_agent");
        }
        
        // If we couldn't get data from the agent-specific table, try the default ai_agent table
        if (!interactions) {
          const result = await supabase
            .from('ai_agent')
            .select('*')
            .eq('metadata->>client_id', clientId)
            .gte('created_at', thirtyDaysAgo);
            
          interactions = result.data;
          error = result.error;
        }

        if (error) throw error;
        
        // Calculate success rate
        const totalCount = interactions?.length || 0;
        let successCount = 0;
        
        if (interactions) {
          for (const interaction of interactions) {
            // Safe access with type checking
            if (interaction && 
                typeof interaction === 'object' && 
                'metadata' in interaction && 
                interaction.metadata && 
                typeof interaction.metadata === 'object' && 
                'success' in interaction.metadata) {
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
    enabled: !!clientId,
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

  // Fetch recent activities
  const activitiesQuery = useQuery({
    queryKey: ["recent-activities", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  return {
    clientId,
    interactionStats: interactionStatsQuery.data,
    isLoadingStats: interactionStatsQuery.isLoading,
    commonQueries: commonQueriesQuery.data,
    isLoadingQueries: commonQueriesQuery.isLoading,
    errorLogs: errorLogsQuery.data,
    isLoadingErrors: errorLogsQuery.isLoading,
    activities: activitiesQuery.data,
    isLoadingActivities: activitiesQuery.isLoading
  };
}
