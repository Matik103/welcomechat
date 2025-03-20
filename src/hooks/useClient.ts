
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

export const useClient = (id?: string) => {
  const { data: client, isLoading: isLoadingClient, error, refetch: refetchClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log("Fetching client with ID:", id);
      
      // Get client data from ai_agents table
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .single();
        
      if (agentError) {
        console.error("Error fetching client:", agentError);
        throw agentError;
      }
      
      // Convert agent data to client format
      const clientData: Client = {
        id: agentData.id,
        client_name: agentData.client_name || "",
        email: agentData.email || "",
        logo_url: agentData.logo_url || "",
        logo_storage_path: agentData.logo_storage_path || "",
        created_at: agentData.created_at,
        updated_at: agentData.updated_at,
        deletion_scheduled_at: agentData.deletion_scheduled_at,
        deleted_at: agentData.deleted_at,
        status: agentData.status || "active",
        company: agentData.company || "",
        description: agentData.agent_description || "",
        name: agentData.name || "Assistant",
        widget_settings: {
          agent_name: agentData.name || "Assistant",
          agent_description: agentData.agent_description || "",
          logo_url: agentData.logo_url || "",
          logo_storage_path: agentData.logo_storage_path || "",
          ...(agentData.settings?.widget_settings || {})
        }
      };
      
      console.log("Client data fetched from AI agent:", clientData);
      
      return clientData;
    },
    enabled: !!id,
  });

  return { client, isLoadingClient, error, refetchClient };
};
