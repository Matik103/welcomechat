
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

export const useClient = (id?: string) => {
  const { data: client, isLoading: isLoadingClient, error, refetch: refetchClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log("Fetching client with ID:", id);
      
      // Get basic client data first
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
        
      if (clientError) {
        console.error("Error fetching client:", clientError);
        throw clientError;
      }
      
      // Get the agent description from the ai_agents table
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("agent_description")
        .eq("client_id", id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Extract agent_description from widget_settings safely
      let widgetAgentDescription = "";
      if (
        clientData.widget_settings && 
        typeof clientData.widget_settings === 'object' && 
        clientData.widget_settings !== null
      ) {
        widgetAgentDescription = (clientData.widget_settings as any).agent_description || "";
      }
      
      // Combine the data and return the client with the agent description
      const combinedData: Client = {
        ...clientData,
        agent_description: agentData?.agent_description || widgetAgentDescription || "",
      };
      
      console.log("Client data merged with agent description:", combinedData);
      
      return combinedData as Client;
    },
    enabled: !!id,
  });

  return { client, isLoadingClient, error, refetchClient };
};
