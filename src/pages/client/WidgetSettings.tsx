
import { useState, useEffect } from "react";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
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
import { ClientHeader } from "@/components/client/ClientHeader";
import { useMountEffect } from "@/hooks/useMountEffect";

export default function ClientWidgetSettings() {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const navigation = useNavigation();
  const [isUploading, setIsUploading] = useState(false);
  const { logClientActivity } = useClientActivity(clientId);
  const widgetSettingsHook = useWidgetSettings(clientId || "");
  
  // Get client data to sync agent name
  const { client, isLoadingClient, refetchClient } = useClientData(clientId);

  useMountEffect(() => {
    logClientActivity("widget_settings_viewed", "Widget settings page viewed");
  });

  // Fetch widget settings
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["widget-settings", clientId],
    queryFn: () => clientId ? getWidgetSettings(clientId) : Promise.resolve(defaultSettings),
    enabled: !!clientId,
  });

  // Ensure settings has the clientId
  const enhancedSettings = settings ? { ...settings, clientId } : { ...defaultSettings, clientId };

  // Sync agent name from client data when settings load
  useEffect(() => {
    if (!isLoadingClient && client && settings) {
      console.log("Current client and settings state:", { 
        client: {
          agent_name: client.agent_name,
          logo_url: client.logo_url
        },
        settings: {
          agent_name: settings.agent_name,
          logo_url: settings.logo_url
        }
      });
    }
  }, [client, settings, isLoadingClient]);

  // Update widget settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettingsType): Promise<void> => {
      if (clientId) {
        // Ensure clientId is included
        await updateWidgetSettings(clientId, { ...newSettings, clientId });
        
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
      refetchClient();
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
          
        // Refetch both widget settings and client data
        refetch();
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
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl py-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-1"
          onClick={handleNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <WidgetSettingsContainer
          clientId={clientId}
          settings={enhancedSettings as WidgetSettingsType}
          isClientView={true}
          isUploading={isUploading}
          updateSettingsMutation={updateSettingsWrapper}
          handleBack={handleNavigateBack}
          handleLogoUpload={handleLogoUploadChange}
          logClientActivity={logActivityWrapper}
        />
      </div>
    </div>
  );
}
