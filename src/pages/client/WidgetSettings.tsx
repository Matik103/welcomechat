
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { useClientData } from '@/hooks/useClientData';
import { useClientActivity } from '@/hooks/useClientActivity';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { WidgetSettingsContainer } from '@/components/widget/WidgetSettingsContainer';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { toast } from 'sonner';
import { defaultSettings } from '@/types/widget-settings';
import { handleLogoUpload } from '@/services/uploadService';

export default function WidgetSettings() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const clientId = user?.user_metadata?.client_id;
  const [isUploading, setIsUploading] = useState(false);
  
  const { client } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  const { 
    settings, 
    isLoading, 
    updateSettingsMutation, 
    updateLogo 
  } = useWidgetSettings(clientId || "");

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

  const handleLogoUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!clientId) return;
    
    setIsUploading(true);
    try {
      const result = await handleLogoUpload(event, clientId);
      
      if (result) {
        await updateLogo(result.url, result.path);
        
        // Log with the correct client name
        await logClientActivity("logo_uploaded", 
          `Logo updated for "${client?.client_name || 'your account'}"`, 
          {
            client_name: client?.client_name,
            agent_name: settings?.agent_name,
            logo_url: result.url
          });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Create a wrapper for updateSettingsMutation to match expected props
  const updateSettingsWrapper = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: updateSettingsMutation.mutateAsync
  };

  // Type-safe logClientActivity with client name
  const logActivityWrapper = async (): Promise<void> => {
    await logClientActivity("widget_previewed", 
      `Widget previewed for "${client?.client_name || 'your account'}"`, 
      {
        client_name: client?.client_name,
        agent_name: settings?.agent_name
      });
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-1"
          onClick={handleNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <PageHeading>
          Widget Settings
          <p className="text-sm font-normal text-muted-foreground">
            Customize how your AI assistant looks and behaves
          </p>
        </PageHeading>
        
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
