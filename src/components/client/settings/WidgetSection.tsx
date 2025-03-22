
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Configure your widget's appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingSettings
            settings={settings}
            isUploading={isUploading}
            onSettingsChange={onSettingsChange}
            onLogoUpload={onLogoUpload}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your widget</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </CardContent>
      </Card>
    </>
  );
}
