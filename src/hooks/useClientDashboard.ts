import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClientDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-dashboard", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the client ID for the current user
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, agent_name")
        .eq("user_id", user.id)
        .single();

      if (clientError) {
        throw new Error("Failed to fetch client data");
      }

      if (!clientData?.agent_name) {
        throw new Error("No agent name found for client");
      }

      // Check if the table exists for this agent
      // Use a properly typed function name instead of "check_table_exists"
      const { data, error } = await supabase.functions.invoke("get_table_status", {
        body: { agent_name: clientData.agent_name.toLowerCase().replace(/\s+/g, '_') }
      });

      if (error) {
        throw new Error("Failed to check table status");
      }

      // Get recent interactions
      let recentInteractions = [];
      if (data?.table_exists) {
        const tableName = clientData.agent_name.toLowerCase().replace(/\s+/g, '_');
        const { data: interactionData, error: interactionError } = await supabase
          .from(tableName)
          .select('id, content, metadata')
          .eq('metadata->>type', 'chat_interaction')
          .order('id', { ascending: false })
          .limit(5);

        if (!interactionError) {
          recentInteractions = interactionData || [];
        }
      }

      return {
        clientId: clientData.id,
        agentName: clientData.agent_name,
        tableExists: data?.table_exists || false,
        recentInteractions
      };
    },
    enabled: !!user,
  });
};
