
import { useState } from "react";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWidgetSettings, updateWidgetSettings } from "@/services/widgetSettingsService";
import { handleLogoUpload } from "@/services/uploadService";
import { defaultSettings } from "@/types/widget-settings";
import type { WidgetSettings as WidgetSettingsType } from "@/types/widget-settings";
import { toast } from "sonner";
import { useNavigation } from "@/hooks/useNavigation";
import { ClientViewLoading } from "@/components/client-view/ClientViewLoading";
import { useClientData } from "@/hooks/useClientData";
import { useEffect } from "react";

export default function WidgetSettings() {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const { logClientActivity } = useClientActivity(clientId || "");
  const widgetSettingsHook = useWidgetSettings(clientId || "");

  // Use useClientData with proper client ID
  const { client, isLoadingClient, refetchClient } = useClientData(clientId);

  // Fetch widget settings with proper client ID
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["widget-settings", clientId],
    queryFn: () => clientId ? getWidgetSettings(clientId) : Promise.resolve(defaultSettings),
    enabled: !!clientId,
  });

  // Log current data state on load for debugging
  useEffect(() => {
    if (client && settings) {
      console.log("Client view - current data state:", {
        clientId,
        clientAgentName: client.agent_name,
        settingsAgentName: settings.agent_name
      });
    }
  }, [client, settings, clientId]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettingsType): Promise<void> => {
      if (clientId) {
        await updateWidgetSettings(clientId, newSettings);
        
        const clientName = client?.client_name || settings?.agent_name || "Unknown";
        
        await logClientActivity("widget_settings_updated", 
          `Widget settings updated for "${clientName}"`, 
          {
            client_name: clientName,
            agent_name: settings?.agent_name,
            settings_changed: true
          });
      }
    },
    onSuccess: () => {
      refetch();
      if (clientId) {
        // Invalidate client query to ensure bidirectional sync
        queryClient.invalidateQueries({ queryKey: ['client', clientId] });
        refetchClient();
      }
      toast.success("Your AI assistant settings have been updated");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

  const handleLogoUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!clientId) return;
    
    setIsUploading(true);
    try {
      const result = await handleLogoUpload(event, clientId);
      
      if (result) {
        await widgetSettingsHook.updateLogo(result.url, result.path);
        
        const clientName = client?.client_name || settings?.agent_name || "Unknown";
        
        await logClientActivity("logo_uploaded", 
          `Logo updated for "${clientName}"`, 
          {
            client_name: clientName,
            agent_name: settings?.agent_name,
            logo_url: result.url
          });
          
        refetch();
        queryClient.invalidateQueries({ queryKey: ['client', clientId] });
        refetchClient();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || isLoadingClient) {
    return <ClientViewLoading />;
  }

  const updateSettingsWrapper = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: updateSettingsMutation.mutateAsync
  };

  const logActivityWrapper = async (): Promise<void> => {
    const clientName = client?.client_name || settings?.agent_name || "Unknown";
    
    await logClientActivity("widget_previewed", 
      `Widget previewed for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: settings?.agent_name
      });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl py-6">
      <WidgetSettingsContainer
        clientId={clientId}
        settings={settings || defaultSettings}
        isClientView={true}
        isUploading={isUploading}
        updateSettingsMutation={updateSettingsWrapper}
        handleBack={handleNavigateBack}
        handleLogoUpload={handleLogoUploadChange}
        logClientActivity={logActivityWrapper}
      />
    </div>
  );
}
