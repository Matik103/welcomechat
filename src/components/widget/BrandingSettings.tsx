
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Copy, Image } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
      console.log("Setting logo preview from settings:", settings.logo_url);
      setLogoPreview(settings.logo_url);
    } else {
      setLogoPreview(null);
    }
  }, [settings.logo_url]);

  // Handle logo file selection for preview
  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, PNG, GIF, SVG, WebP)");
        return;
      }
      
      // Show preview immediately before upload completes
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        console.log("Setting local preview before upload:", previewUrl.substring(0, 50) + "...");
        setLogoPreview(previewUrl);
      };
      reader.readAsDataURL(file);
      
      // Trigger the actual upload
      onLogoUpload(event);
    }
  };
  
  const handleRemoveLogo = () => {
    console.log("Removing logo");
    setLogoPreview(null);
    onSettingsChange({ logo_url: "" });
    toast.success("Logo removed");
  };

  const copyLogoUrl = () => {
    if (settings.logo_url) {
      navigator.clipboard.writeText(settings.logo_url);
      toast.success("Logo URL copied to clipboard");
    }
  };

  // Extract the folder name from the logo URL for display
  const getLogoUrlPath = () => {
    if (!settings.logo_url) return '';
    
    try {
      // Parse out the folder structure from the URL
      const url = new URL(settings.logo_url);
      const pathParts = url.pathname.split('/');
      // Look for the folder name in the path (usually before the filename)
      const folderIndex = pathParts.findIndex(part => part === "Logo URL");
      
      if (folderIndex !== -1) {
        return `From folder: Logo URL`;
      }
      return '';
    } catch (e) {
      return '';
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
                onError={(e) => {
                  console.error("Error loading logo preview:", logoPreview);
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="text-transparent group-hover:text-white"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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

      {/* Generated Logo URL field with folder path highlighted */}
      <div>
        <Label htmlFor="generated_logo_url" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Generated Logo URL
        </Label>
        <div className="flex mt-1 flex-col">
          <div className="flex">
            <Input
              id="generated_logo_url"
              value={settings.logo_url || ''}
              readOnly
              className="flex-1 pr-10 font-mono text-xs bg-gray-50"
              placeholder="Upload a logo to generate URL"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={copyLogoUrl}
              disabled={!settings.logo_url}
              title="Copy URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {settings.logo_url && (
            <p className="text-xs text-indigo-600 font-medium mt-1">
              {getLogoUrlPath()}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          This is the automatically generated URL for your logo that will be used in the widget.
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
