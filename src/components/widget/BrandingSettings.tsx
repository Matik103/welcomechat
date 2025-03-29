
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
    <div className="space-y-6">
      <div>
        <Label htmlFor="agent_name">AI Agent Name</Label>
        <Input
          id="agent_name"
          value={settings.agent_name || ''}
          onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
          placeholder="AI Assistant"
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          This is the name that will be displayed to your users in the chat widget
        </p>
      </div>

      <div>
        <Label>Logo</Label>
        <div className="flex-grow mt-2">
          <LogoManagement
            logoUrl={settings.logo_url}
            isUploading={isUploading}
            onLogoUpload={onLogoUpload}
            onRemoveLogo={handleRemoveLogo}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Upload your brand logo to personalize the chat widget. This will appear as the agent's avatar in conversations.
          </p>
        </div>
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
        <p className="text-sm text-muted-foreground mt-1">
          The first message users see when they open the chat
        </p>
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
        <p className="text-sm text-muted-foreground mt-1">
          Let users know how quickly they can expect a response
        </p>
      </div>
    </div>
  );
}
