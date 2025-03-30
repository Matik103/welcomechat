
import { useState } from "react";
import { WidgetSettings } from "@/types/client-form";
import { WidgetSettingsForm } from "@/components/widget/WidgetSettingsForm";
import { WidgetPreviewCard } from "@/components/widget/WidgetPreviewCard";
import { EmbedCodeCard } from "@/components/widget/EmbedCodeCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WidgetSettingsContainerProps {
  clientId?: string;
  settings: WidgetSettings;
  isClientView: boolean;
  isUploading: boolean;
  updateSettingsMutation: {
    isPending: boolean;
    mutateAsync: (newSettings: WidgetSettings) => Promise<void>;
  };
  handleBack: () => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  logClientActivity: () => Promise<void>;
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
  const [currentSettings, setCurrentSettings] = useState<WidgetSettings>(settings);

  const handleSettingsChange = (newSettings: Partial<WidgetSettings>) => {
    setCurrentSettings({ ...currentSettings, ...newSettings });
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(currentSettings);
      toast.success("Widget settings saved successfully!");
    } catch (error) {
      console.error("Error saving widget settings:", error);
      toast.error("Failed to save widget settings. Please try again.");
    }
  };

  const handleCopyEmbedCode = async () => {
    if (isClientView) {
      // Log activity when embed code is copied with detailed information
      await logClientActivity();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Widget Settings</h1>
        <p className="text-gray-500">Customize how your chat widget looks and behaves</p>
      </div>
      
      <WidgetSettingsForm
        settings={currentSettings}
        isUploading={isUploading}
        onSettingsChange={handleSettingsChange}
        onLogoUpload={handleLogoUpload}
      />
      
      <WidgetPreviewCard 
        settings={currentSettings} 
        clientId={clientId} 
      />
      
      <div className="relative z-0">
        <EmbedCodeCard 
          settings={currentSettings} 
          onCopy={handleCopyEmbedCode} 
        />
      </div>
      
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
  );
}
