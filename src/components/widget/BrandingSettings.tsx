
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettings } from "@/types/widget-settings";
import { LogoManagement } from "./LogoManagement";

interface BrandingSettingsProps {
  settings: WidgetSettings;
  isUploading: boolean;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BrandingSettings({
  settings,
  isUploading,
  onSettingsChange,
  onLogoUpload
}: BrandingSettingsProps) {
  const handleRemoveLogo = () => {
    onSettingsChange({ logo_url: "", logo_storage_path: "" });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Logo</Label>
        <LogoManagement
          logoUrl={settings.logo_url}
          isUploading={isUploading}
          onLogoUpload={onLogoUpload}
          onRemoveLogo={handleRemoveLogo}
        />
      </div>

      <div>
        <Label htmlFor="welcome_text">Welcome Message</Label>
        <Input
          id="welcome_text"
          value={settings.welcome_text || ''}
          onChange={(e) => onSettingsChange({ welcome_text: e.target.value })}
          placeholder="Hi 👋, how can I help?"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="response_time_text">Response Time Message</Label>
        <Input
          id="response_time_text"
          value={settings.response_time_text || ''}
          onChange={(e) => onSettingsChange({ response_time_text: e.target.value })}
          placeholder="I typically respond right away"
          className="mt-1"
        />
      </div>
    </div>
  );
}
