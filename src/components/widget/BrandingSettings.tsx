
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettings } from "@/types/widget-settings";
import { useEffect } from "react";

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
  // Handle agent name with potential " Assistant" suffix
  useEffect(() => {
    if (settings.agent_name && settings.agent_name.endsWith(" Assistant")) {
      // Remove " Assistant" suffix automatically
      onSettingsChange({ 
        agent_name: settings.agent_name.substring(0, settings.agent_name.length - 10) 
      });
    }
  }, [settings.agent_name, onSettingsChange]);
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agent_name">Agent Name</Label>
        <Input
          id="agent_name"
          value={settings.agent_name}
          onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
          placeholder="Your AI assistant's name"
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          This is the name that will appear in the chat header.
        </p>
      </div>

      <div>
        <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
        <Input
          id="webhook_url"
          value={settings.webhook_url || ''}
          onChange={(e) => onSettingsChange({ webhook_url: e.target.value })}
          placeholder="https://your-webhook-url.com"
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          API endpoint that will receive and respond to chat messages. If not provided, our default AI endpoint will be used.
        </p>
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
