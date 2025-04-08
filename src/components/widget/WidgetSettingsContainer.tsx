
import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetSection } from "@/components/client/settings/WidgetSection";
import { Button } from "@/components/ui/button";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";
import { EmbedCodeCard } from "./EmbedCodeCard";
import { toast } from "sonner";
import { WidgetPreviewCard } from "./WidgetPreviewCard";
import { ErrorBoundary } from "@/components";

interface UpdateSettingsMutation {
  isPending: boolean;
  mutateAsync: (newSettings: WidgetSettings) => Promise<any>;
}

interface WidgetSettingsContainerProps {
  clientId?: string;
  settings: WidgetSettings;
  isClientView?: boolean;
  isUploading: boolean;
  updateSettingsMutation: UpdateSettingsMutation;
  handleBack?: () => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  logClientActivity: () => Promise<void>;
}

export function WidgetSettingsContainer({
  clientId,
  settings,
  isClientView = false,
  isUploading,
  updateSettingsMutation,
  handleBack,
  handleLogoUpload,
  logClientActivity
}: WidgetSettingsContainerProps) {
  // Create a copy of settings that includes clientId and ensure all required properties exist
  const initialSettings = {
    ...defaultSettings, // Start with default settings
    ...settings, // Override with provided settings
    clientId: settings?.clientId || clientId  // Ensure clientId is set
  };
  
  const [activeSettings, setActiveSettings] = useState<WidgetSettings>(initialSettings);
  
  const handleSettingsChange = (partialSettings: Partial<WidgetSettings>) => {
    console.log("Settings change:", partialSettings);
    setActiveSettings((prev) => ({ ...prev, ...partialSettings }));
  };

  const handleSubmit = async () => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to update settings");
        return;
      }
      
      // Ensure clientId is included in the settings when submitting
      const settingsToSubmit = {
        ...activeSettings,
        clientId
      };
      
      console.log("Submitting settings:", settingsToSubmit);
      await updateSettingsMutation.mutateAsync(settingsToSubmit);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handlePreviewInteraction = async () => {
    try {
      await logClientActivity();
    } catch (error) {
      console.error("Error logging client activity:", error);
    }
  };

  const handleCopyCode = () => {
    toast.success("Widget code copied to clipboard!");
  };

  return (
    <ErrorBoundary>
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Widget Settings</h1>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="space-y-6">
            <WidgetSection
              settings={activeSettings}
              isUploading={isUploading}
              onSettingsChange={handleSettingsChange}
              onLogoUpload={handleLogoUpload}
            />
            
            {/* Widget Preview Card */}
            <WidgetPreviewCard
              settings={activeSettings}
              clientId={clientId || ''}
              onInteraction={handlePreviewInteraction}
            />
            
            <EmbedCodeCard 
              settings={activeSettings} 
              onCopy={handleCopyCode}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
