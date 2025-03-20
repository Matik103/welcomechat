
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { WidgetSettings as IWidgetSettings, isWidgetSettings } from "@/types/widget-settings";
import { useClientActivity } from "@/hooks/useClientActivity";
import { convertSettingsToJson, handleLogoUploadEvent } from "@/utils/widgetSettingsUtils";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

// Define the default settings here first so it's available throughout the hook
const defaultSettings: IWidgetSettings = {
  agent_name: "",
  agent_description: "",
  welcome_text: "Hi 👋, how can I help?",
  chat_color: "#3f83f8",
  background_color: "#ffffff",
  text_color: "#ffffff",
  secondary_color: "#6366f1",
  logo_url: "",
  logo_storage_path: "",
  position: "bottom-right" as const,
  response_time_text: "I typically respond right away"
};

export function useWidgetSettings(clientId: string | undefined, isClientView: boolean = false) {
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);
  const { logClientActivity } = useClientActivity(clientId);

  console.log("Client ID for widget settings:", clientId);

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      console.log("Fetching client data for ID:", clientId);
      
      await checkAndRefreshAuth();
      
      // Updated to query ai_agents instead of clients
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (error) {
        console.error("Error fetching client:", error);
        throw error;
      }
      
      console.log("Client data fetched:", data);
      return data;
    },
    enabled: !!clientId,
    staleTime: 0,
    retry: 1
  });

  useEffect(() => {
    if (client) {
      console.log("Client data:", client);
      console.log("Settings from client:", client.settings);
      
      // Extract widget settings from the settings field
      if (client.settings && client.settings.widget_settings && isWidgetSettings(client.settings.widget_settings)) {
        console.log("Valid widget settings detected, applying to state");
        setSettings(client.settings.widget_settings as IWidgetSettings);
      } else {
        console.log("Invalid or missing widget settings, using defaults with agent name");
        // Use agent name from ai_agents if available
        setSettings({
          ...defaultSettings,
          agent_name: client.name || defaultSettings.agent_name,
          agent_description: client.agent_description || defaultSettings.agent_description,
          logo_url: client.logo_url || defaultSettings.logo_url,
          logo_storage_path: client.logo_storage_path || defaultSettings.logo_storage_path
        });
      }
    }
  }, [client]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      console.log("Saving widget settings:", newSettings);
      
      if (!clientId) {
        throw new Error("No client ID available");
      }
      
      await checkAndRefreshAuth();
      
      let clientName = "";
      try {
        // Get client name from ai_agents
        const { data, error } = await supabase
          .from("ai_agents")
          .select("client_name")
          .eq("id", clientId)
          .single();
          
        if (!error && data) {
          clientName = data.client_name;
          console.log("Got client name for settings sync:", clientName);
        }
      } catch (error) {
        console.error("Error getting client name:", error);
      }
      
      const settingsJson = convertSettingsToJson(newSettings);
      console.log("Settings being saved to DB:", settingsJson);
      
      import("@/utils/aiAgentSync").then(({ syncWidgetSettingsWithAgent }) => {
        syncWidgetSettingsWithAgent(clientId, newSettings, clientName)
          .then(success => {
            if (success) {
              console.log("Widget settings synchronized with AI agent");
            } else {
              console.log("Could not synchronize widget settings with AI agent");
            }
          })
          .catch(error => {
            console.error("Error syncing widget settings with AI agent:", error);
          });
      });
      
      // Update the ai_agents table with the new settings
      const { error, data } = await supabase
        .from("ai_agents")
        .update({
          name: newSettings.agent_name || "Assistant", // Update the name field directly
          agent_description: newSettings.agent_description || "", // Update agent_description directly
          logo_url: newSettings.logo_url || "",
          logo_storage_path: newSettings.logo_storage_path || "",
          settings: {
            ...client?.settings,
            widget_settings: settingsJson
          }
        })
        .eq("id", clientId)
        .select();
      
      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      
      return data;
    },
    onSuccess: () => {
      if (isClientView) {
        logClientActivity(
          "widget_settings_updated", 
          "updated widget settings", 
          { 
            updated_fields: Object.keys(settings).filter(key => 
              client?.settings?.widget_settings && 
              settings[key as keyof IWidgetSettings] !== client.settings.widget_settings[key]
            ) 
          }
        );
      }
      
      uiToast({
        title: "Settings saved successfully! 🎉",
        description: "Your widget is ready to be embedded.",
      });
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      uiToast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleLogoUploadEvent(
      event,
      clientId,
      (publicUrl, storagePath) => {
        const newSettings = { 
          ...settings, 
          logo_url: publicUrl,
          logo_storage_path: storagePath
        };
        setSettings(newSettings);
        updateSettingsMutation.mutateAsync(newSettings);

        if (isClientView) {
          logClientActivity(
            "logo_uploaded", 
            "uploaded a new logo for their widget", 
            { logo_url: publicUrl, logo_storage_path: storagePath }
          );
        }

        setTimeout(() => {
          refetch().then(() => {
            console.log("Refetched client data after logo upload");
            queryClient.invalidateQueries({ queryKey: ["client", clientId] });
          });
        }, 1000);

        toast.success("Logo uploaded successfully! ✨");
      },
      (error) => {
        toast.error(error.message || "Failed to upload logo");
      },
      () => setIsUploading(true),
      () => setIsUploading(false)
    );
  };

  return {
    settings,
    setSettings,
    isLoading,
    isUploading,
    client,
    refetchClient: refetch,
    updateSettingsMutation: {
      isPending: updateSettingsMutation.isPending,
      mutateAsync: async (newSettings: IWidgetSettings): Promise<void> => {
        await updateSettingsMutation.mutateAsync(newSettings);
      }
    },
    handleLogoUpload
  };
}
