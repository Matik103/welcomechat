
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, WidgetSettings } from "@/types/client";

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
      
      // Extract widget_settings from settings if available
      const settings = agentData.settings || {};
      const widgetSettings: WidgetSettings = {
        agent_name: agentData.name || "Assistant",
        agent_description: agentData.agent_description || "",
        logo_url: agentData.logo_url || "",
        logo_storage_path: agentData.logo_storage_path || ""
      };

      // If settings exists and has widget properties, merge them
      if (typeof settings === 'object') {
        // Copy known widget properties
        if (settings.chat_color) widgetSettings.chat_color = settings.chat_color;
        if (settings.background_color) widgetSettings.background_color = settings.background_color;
        if (settings.text_color) widgetSettings.text_color = settings.text_color;
        if (settings.secondary_color) widgetSettings.secondary_color = settings.secondary_color;
        if (settings.position) widgetSettings.position = settings.position;
        if (settings.welcome_text) widgetSettings.welcome_text = settings.welcome_text;
        if (settings.response_time_text) widgetSettings.response_time_text = settings.response_time_text;
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
        agent_name: agentData.name || "Assistant",
        last_active: agentData.last_active,
        widget_settings: widgetSettings
      };
      
      console.log("Client data fetched from AI agent:", clientData);
      
      return clientData;
    },
    enabled: !!id,
  });

  return { client, isLoadingClient, error, refetchClient };
};
