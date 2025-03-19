
import { useState } from "react";
import { WidgetSettings as IWidgetSettings } from "@/types/widget-settings";
import { WidgetSettingsForm } from "@/components/widget/WidgetSettingsForm";
import { WidgetSettingsHeader } from "@/components/widget/WidgetSettingsHeader";
import { WidgetPreviewCard } from "@/components/widget/WidgetPreviewCard";
import { EmbedCodeCard } from "@/components/widget/EmbedCodeCard";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { ExtendedActivityType } from "@/types/activity";
import { toast } from "sonner";

interface WidgetSettingsContainerProps {
  clientId?: string;
  settings: IWidgetSettings;
  isClientView: boolean;
  isUploading: boolean;
  updateSettingsMutation: {
    isPending: boolean;
    mutateAsync: (newSettings: IWidgetSettings) => Promise<void>;
  };
  handleBack: () => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: any) => Promise<void>;
}

export function WidgetSettingsContainer({
  clientId,
  settings,
  isClientView,
  isUploading,
  updateSettingsMutation,
  handleBack,
  handleLogoUpload,
  logClientActivity
}: WidgetSettingsContainerProps) {
  const [currentSettings, setCurrentSettings] = useState<IWidgetSettings>(settings);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const handleSettingsChange = (newSettings: Partial<IWidgetSettings>) => {
    setCurrentSettings({ ...currentSettings, ...newSettings });
  };

  const handleSave = async () => {
    try {
      console.log("Saving widget settings:", currentSettings);
      await updateSettingsMutation.mutateAsync(currentSettings);
      toast.success("Widget settings saved successfully!");
      
      if (isClientView) {
        logClientActivity(
          "widget_settings_updated", 
          "updated widget settings", 
          { updated_settings: Object.keys(currentSettings) }
        );
      }
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings. Please try again.");
    }
  };

  const handleCopyEmbedCode = () => {
    if (isClientView) {
      logClientActivity(
        "embed_code_copied", 
        "copied the widget embed code",
        {}
      );
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <WidgetSettingsHeader onBack={handleBack} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WidgetSettingsForm
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
}
