
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, WidgetSettings } from "@/types/client";
import { execSql } from "@/utils/rpcUtils";
import { safeParse } from "@/utils/stringUtils";

export const useClient = (id?: string) => {
  const { data: client, isLoading: isLoadingClient, error, refetch: refetchClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log("Fetching client with ID:", id);
      
      // Use SQL query via RPC to get client data from ai_agents table
      const sql = `
        SELECT * FROM ai_agents
        WHERE id = $1
        LIMIT 1
      `;
      
      const data = await execSql(sql, { id });
      
      if (!Array.isArray(data) || data.length === 0) {
        console.error("No client data found for ID:", id);
        return null;
      }
      
      const agentData = data[0];
      
      // Extract widget_settings from settings if available
      const settings = agentData.settings || {};
      const widgetSettings: WidgetSettings = {
        agent_name: agentData.name || "Assistant",
        agent_description: agentData.agent_description || "",
        logo_url: agentData.logo_url || "",
        logo_storage_path: agentData.logo_storage_path || ""
      };

      // Safely handle settings as it could be a string or object
      const parsedSettings = typeof settings === 'string' ? safeParse(settings) : settings;
      
      // If settings exists and has widget properties, merge them
      if (typeof parsedSettings === 'object') {
        // Copy known widget properties
        if ('chat_color' in parsedSettings) widgetSettings.chat_color = parsedSettings.chat_color;
        if ('background_color' in parsedSettings) widgetSettings.background_color = parsedSettings.background_color;
        if ('text_color' in parsedSettings) widgetSettings.text_color = parsedSettings.text_color;
        if ('secondary_color' in parsedSettings) widgetSettings.secondary_color = parsedSettings.secondary_color;
        if ('position' in parsedSettings) widgetSettings.position = parsedSettings.position;
        if ('welcome_text' in parsedSettings) widgetSettings.welcome_text = parsedSettings.welcome_text;
        if ('response_time_text' in parsedSettings) widgetSettings.response_time_text = parsedSettings.response_time_text;
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
