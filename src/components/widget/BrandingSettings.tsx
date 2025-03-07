
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useState, useEffect } from "react";

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
  // Add state to handle logo preview
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Update logo preview when settings change
  useEffect(() => {
    if (settings.logo_url) {
      setLogoPreview(settings.logo_url);
    }
  }, [settings.logo_url]);

  // Handle logo file selection for preview
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show preview and then upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Trigger the actual upload
      onLogoUpload(event);
    }
  };

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
        <Label htmlFor="logo">Logo</Label>
        <div className="mt-1 flex items-center gap-4">
          {logoPreview ? (
            <div className="relative group">
              <img 
                src={logoPreview} 
                alt="Logo" 
                className="h-16 w-16 object-contain rounded border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-transparent group-hover:text-white opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setLogoPreview(null);
                    onSettingsChange({ logo_url: "" });
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : null}
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
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
              aria-label="Upload logo"
            />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Recommended size: 64x64px. Max size: 5MB. The logo will be displayed in the chat header.
        </p>
      </div>

      <div>
        <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
        <Input
          id="webhook_url"
          value={settings.webhook_url}
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
          value={settings.welcome_text}
          onChange={(e) => onSettingsChange({ welcome_text: e.target.value })}
          placeholder="Hi 👋, how can I help?"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="response_time_text">Response Time Message</Label>
        <Input
          id="response_time_text"
          value={settings.response_time_text}
          onChange={(e) => onSettingsChange({ response_time_text: e.target.value })}
          placeholder="I typically respond right away"
          className="mt-1"
        />
      </div>
    </div>
  );
}
