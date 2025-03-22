
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { WidgetSection } from "@/components/client/settings/WidgetSection";
import { WidgetPreviewCard } from "@/components/widget/WidgetPreviewCard";
import { EmbedCodeCard } from "@/components/widget/EmbedCodeCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientActivity } from "@/hooks/useClientActivity";

const ResourceSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);
  
  const { 
    client, 
    isLoadingClient,
  } = useClientData(clientId);

  const { 
    settings, 
    isLoading: isLoadingSettings, 
    isUploading, 
    updateSettingsMutation, 
    handleLogoUpload: originalHandleLogoUpload 
  } = useWidgetSettings(clientId, true);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      await originalHandleLogoUpload(event.target.files[0]);
    }
  };

  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    // Create a new settings object with the updated values
    const updatedSettings = { ...settings, ...newSettings };
    // Update the state
    setCurrentSettings(updatedSettings);
  };

  const [currentSettings, setCurrentSettings] = useState(settings);

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(currentSettings);
      toast.success("Widget settings saved successfully!");
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings. Please try again.");
    }
  };

  const handleCopyEmbedCode = () => {
    logClientActivity(
      "embed_code_copied", 
      "copied the widget embed code",
      {}
    );
  };

  if (isLoadingClient || isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Widget Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WidgetSection
            settings={currentSettings}
            isUploading={isUploading}
            onSettingsChange={handleSettingsChange}
            onLogoUpload={handleLogoUpload}
          />
          
          <EmbedCodeCard 
            settings={currentSettings} 
            onCopy={handleCopyEmbedCode} 
          />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={updateSettingsMutation.isPending || isUploading}
              className="mr-2"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <WidgetPreviewCard settings={currentSettings} clientId={clientId} />
        </div>
      </div>
    </div>
  );
};

export default ResourceSettings;
