
import { Card } from "@/components/ui/card";
import { BrandingSettings } from "@/components/widget/BrandingSettings";
import { AppearanceSettings } from "@/components/widget/AppearanceSettings";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetSectionProps {
  settings: WidgetSettings;
  isUploading: boolean;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WidgetSection({ 
  settings,
  isUploading,
  onSettingsChange,
  onLogoUpload
}: WidgetSectionProps) {
  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Branding</h2>
        <BrandingSettings
          settings={settings}
          isUploading={isUploading}
          onSettingsChange={onSettingsChange}
          onLogoUpload={onLogoUpload}
        />
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <AppearanceSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </Card>
    </>
  );
}
