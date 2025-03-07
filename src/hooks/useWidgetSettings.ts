
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { WidgetSettings as IWidgetSettings, defaultSettings, isWidgetSettings } from "@/types/widget-settings";
import { useClientActivity } from "@/hooks/useClientActivity";
import { convertSettingsToJson, handleLogoUploadEvent } from "@/utils/widgetSettingsUtils";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

export function useWidgetSettings(clientId: string | undefined, isClientView: boolean = false) {
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);
  const { logClientActivity } = useClientActivity(clientId);

  console.log("Client ID for widget settings:", clientId);

  // Fetch client data including widget settings
  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      console.log("Fetching client data for ID:", clientId);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const { data, error } = await supabase
        .from("clients")
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

  // Update settings state when client data changes
  useEffect(() => {
    if (client) {
      console.log("Client data:", client);
      console.log("Widget settings from client:", client.widget_settings);
      
      if (client.widget_settings && isWidgetSettings(client.widget_settings)) {
        console.log("Valid widget settings detected, applying to state");
        setSettings(client.widget_settings as IWidgetSettings);
      } else {
        console.log("Invalid or missing widget settings, using defaults with agent name");
        setSettings({
          ...defaultSettings,
          agent_name: client.agent_name || ""
        });
      }
    }
  }, [client]);

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      console.log("Saving widget settings:", newSettings);
      
      if (!clientId) {
        throw new Error("No client ID available");
      }
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const settingsJson = convertSettingsToJson(newSettings);
      console.log("Settings being saved to DB:", settingsJson);
      
      const { error, data } = await supabase
        .from("clients")
        .update({
          widget_settings: settingsJson
        })
        .eq("id", clientId)
        .select();
      
      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      // Force refetch to ensure we have the latest data
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
              client?.widget_settings && 
              settings[key as keyof IWidgetSettings] !== client.widget_settings[key]
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

  // Handle logo upload
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

        // Force refetch after a short delay to get the updated URL from the database
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
