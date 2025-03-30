
import { useState, useEffect } from "react";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getWidgetSettings, updateWidgetSettings } from "@/services/widgetSettingsService";
import { handleLogoUpload } from "@/services/uploadService";
import { defaultSettings } from "@/types/widget-settings";
import type { WidgetSettings as WidgetSettingsType } from "@/types/widget-settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useClientData } from "@/hooks/useClientData";
import { ClientViewLoading } from "@/components/client-view/ClientViewLoading";
import { ClientLayout } from "@/components/layout/ClientLayout";

export default function WidgetSettings() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  const [isUploading, setIsUploading] = useState(false);
  
  // Use client ID from user metadata when in client view
  const clientId = isAdmin ? undefined : user?.user_metadata?.client_id;
  
  const { logClientActivity } = useClientActivity(clientId);
  const widgetSettingsHook = useWidgetSettings(clientId || "");
  
  // Get client data to sync agent name
  const { client, isLoadingClient } = useClientData(clientId);

  // Fetch widget settings
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["widget-settings", clientId],
    queryFn: () => clientId ? getWidgetSettings(clientId) : Promise.resolve(defaultSettings),
    enabled: !!clientId,
  });

  // Sync agent name from client data when settings load
  useEffect(() => {
    if (!isLoadingClient && client && settings && !settings.agent_name) {
      // If we have client data and settings don't have agent_name, sync it
      if (client.agent_name) {
        updateSettingsMutation.mutate({
          ...settings,
          agent_name: client.agent_name
        });
      }
    }
  }, [client, settings, isLoadingClient]);

  // Update widget settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettingsType): Promise<void> => {
      if (clientId) {
        await updateWidgetSettings(clientId, newSettings);
        
        // Make sure we have a client name for the activity log
        const clientName = client?.client_name || newSettings.agent_name || "Unknown";
        
        // Log the activity with safe activity type and client name
        await logClientActivity("widget_settings_updated", 
          `Widget settings updated for "${clientName}"`, 
          {
            client_name: clientName,
            agent_name: newSettings.agent_name,
            settings_changed: true
          });
      }
    },
    onSuccess: () => {
      refetch();
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
        
        // Make sure we have a client name for the activity log
        const clientName = client?.client_name || settings?.agent_name || "Unknown";
        
        // Log with the correct client name
        await logClientActivity("logo_uploaded", 
          `Logo updated for "${clientName}"`, 
          {
            client_name: clientName,
            agent_name: settings?.agent_name,
            logo_url: result.url
          });
        refetch();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || isLoadingClient) {
    return (
      <ClientLayout>
        <ClientViewLoading />
      </ClientLayout>
    );
  }

  // Create a wrapper for updateSettingsMutation to match expected props
  const updateSettingsWrapper = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: updateSettingsMutation.mutateAsync
  };

  // Type-safe logClientActivity with client name
  const logActivityWrapper = async (): Promise<void> => {
    // Make sure we have a client name for the activity log
    const clientName = client?.client_name || settings?.agent_name || "Unknown";
    
    await logClientActivity("widget_previewed", 
      `Widget previewed for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: settings?.agent_name
      });
  };

  return (
    <ClientLayout>
      <div className="mx-auto px-4 py-8">
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
    </ClientLayout>
  );
}
