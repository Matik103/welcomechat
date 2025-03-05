
import { useState } from "react";
import { WidgetSettings as IWidgetSettings } from "@/types/widget-settings";
import { WidgetSettingsForm } from "@/components/widget/WidgetSettingsForm";
import { WidgetSettingsHeader } from "@/components/widget/WidgetSettingsHeader";
import { WidgetPreviewCard } from "@/components/widget/WidgetPreviewCard";
import { EmbedCodeCard } from "@/components/widget/EmbedCodeCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ActivityType } from "@/types/activity";

interface WidgetSettingsContainerProps {
  settings: IWidgetSettings;
  isClientView: boolean;
  isUploading: boolean;
  updateSettingsMutation: {
    isPending: boolean;
    mutateAsync: (newSettings: IWidgetSettings) => Promise<void>;
  };
  handleBack: () => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: any) => Promise<void>;
}

export function WidgetSettingsContainer({
  settings,
  isClientView,
  isUploading,
  updateSettingsMutation,
  handleBack,
  handleLogoUpload,
  logClientActivity
}: WidgetSettingsContainerProps) {
  const [currentSettings, setCurrentSettings] = useState<IWidgetSettings>(settings);
  const [showPreview, setShowPreview] = useState(true);

  const handleSettingsChange = (newSettings: Partial<IWidgetSettings>) => {
    setCurrentSettings({ ...currentSettings, ...newSettings });
  };

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync(currentSettings);
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

  const handleTogglePreview = (isVisible: boolean) => {
    setShowPreview(isVisible);
    
    if (isClientView) {
      logClientActivity(
        "widget_previewed", 
        isVisible ? "previewed their widget" : "closed the widget preview",
        {}
      );
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <WidgetSettingsHeader onBack={handleBack} />

      <div className="space-y-6">
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

        <WidgetPreviewCard
          settings={currentSettings}
          showPreview={showPreview}
          onTogglePreview={handleTogglePreview}
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateSettingsMutation.isPending || isUploading}
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
    </div>
  );
}
