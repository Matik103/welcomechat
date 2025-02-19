
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

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
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agent_name">Agent Name</Label>
        <Input
          id="agent_name"
          value={settings.agent_name}
          onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="logo">Logo</Label>
        <div className="mt-1 flex items-center gap-4">
          {settings.logo_url && (
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="h-12 w-12 object-contain rounded border border-gray-200"
            />
          )}
          <Button 
            variant="outline" 
            className="relative"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="webhook_url">N8N Webhook URL</Label>
        <Input
          id="webhook_url"
          value={settings.webhook_url}
          onChange={(e) => onSettingsChange({ webhook_url: e.target.value })}
          placeholder="https://your-n8n-webhook-url.com"
        />
      </div>

      <div>
        <Label htmlFor="welcome_text">Welcome Message</Label>
        <Input
          id="welcome_text"
          value={settings.welcome_text}
          onChange={(e) => onSettingsChange({ welcome_text: e.target.value })}
          placeholder="Hi 👋, how can I help?"
        />
      </div>

      <div>
        <Label htmlFor="response_time_text">Response Time Message</Label>
        <Input
          id="response_time_text"
          value={settings.response_time_text}
          onChange={(e) => onSettingsChange({ response_time_text: e.target.value })}
          placeholder="I typically respond right away"
        />
      </div>
    </div>
  );
}
