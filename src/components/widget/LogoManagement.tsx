
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2, Upload, Trash2, Copy, Image, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface LogoManagementProps {
  logoUrl: string;
  isUploading: boolean;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export function LogoManagement({
  logoUrl,
  isUploading,
  onLogoUpload,
  onRemoveLogo
}: LogoManagementProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (logoUrl) {
      console.log("Setting logo preview from settings:", logoUrl);
      setLogoPreview(logoUrl);
    } else {
      setLogoPreview(null);
    }
  }, [logoUrl]);

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, PNG, GIF, SVG, WebP)");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        console.log("Setting local preview before upload:", previewUrl.substring(0, 50) + "...");
        setLogoPreview(previewUrl);
      };
      reader.readAsDataURL(file);
      
      onLogoUpload(event);
    }
  };

  const copyLogoUrl = () => {
    if (logoUrl) {
      navigator.clipboard.writeText(logoUrl)
        .then(() => {
          setIsCopied(true);
          toast.success("Logo URL copied to clipboard");
          console.log("Copied URL to clipboard:", logoUrl);
          
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        })
        .catch(err => {
          console.error("Failed to copy URL:", err);
          toast.error("Failed to copy URL to clipboard");
        });
    } else {
      toast.error("No logo URL to copy");
    }
  };

  const getLogoUrlPath = () => {
    if (!logoUrl) return '';
    
    try {
      const url = new URL(logoUrl);
      const pathParts = url.pathname.split('/');
      
      // Look for "Logo URL" in the path
      const logoUrlIndex = pathParts.findIndex(part => part === "Logo%20URL" || part === "Logo URL");
      
      if (logoUrlIndex !== -1) {
        return `From folder: Logo URL`;
      }
      return 'From storage: widget-logos';
    } catch (e) {
      console.error("Error parsing logo URL path:", e);
      return '';
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-4">
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
                    onClick={onRemoveLogo}
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

      <div>
        <Label htmlFor="generated_logo_url" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Generated Logo URL
        </Label>
        <div className="flex mt-1 flex-col">
          <div className="flex">
            <Input
              id="generated_logo_url"
              value={logoUrl || ''}
              readOnly
              className={`flex-1 pr-10 font-mono text-xs ${isValidUrl(logoUrl || '') ? 'bg-gray-50' : 'bg-red-50'}`}
              placeholder="Upload a logo to generate URL"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={copyLogoUrl}
              disabled={!logoUrl}
              title="Copy URL"
            >
              {isCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {logoUrl && (
            <p className="text-xs text-indigo-600 font-medium mt-1">
              {getLogoUrlPath()}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          This is the automatically generated URL for your logo that will be used in the widget.
        </p>
      </div>
    </div>
  );
}
