
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Image, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface LogoUrlDisplayProps {
  logoUrl: string;
}

export function LogoUrlDisplay({ logoUrl }: LogoUrlDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Validate URL when it changes
  useEffect(() => {
    const isValid = validateUrl(logoUrl);
    setIsValidUrl(isValid);
  }, [logoUrl]);

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
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

  const getLogoUrlInfo = () => {
    if (!logoUrl) return { path: '', isValid: false };
    
    try {
      const url = new URL(logoUrl);
      const pathParts = url.pathname.split('/');
      
      // Check if URL contains the expected path parts
      const logoUrlIndex = pathParts.findIndex(part => 
        part === "Logo%20URL" || part === "Logo URL"
      );
      
      const bucketIndex = pathParts.findIndex(part => part === "widget-logos");
      
      let path = '';
      if (logoUrlIndex !== -1) {
        path = `From folder: Logo URL`;
      } else if (bucketIndex !== -1) {
        path = 'From storage: widget-logos';
      } else {
        path = 'External URL';
      }
      
      return { path, isValid: true };
    } catch (e) {
      console.error("Error parsing logo URL:", e);
      return { path: 'Invalid URL format', isValid: false };
    }
  };

  const urlInfo = getLogoUrlInfo();

  return (
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
            className={`flex-1 pr-10 font-mono text-xs ${
              isValidUrl ? 'bg-gray-50' : 'bg-red-50'
            }`}
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
            {isCopied ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <Copy className="h-4 w-4" />
            }
          </Button>
        </div>
        {logoUrl && (
          <div className="flex items-center mt-1">
            {isValidUrl ? (
              <p className="text-xs text-indigo-600 font-medium">
                {urlInfo.path}
              </p>
            ) : (
              <p className="text-xs text-red-500 font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Invalid URL format
              </p>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        This is the automatically generated URL for your logo that will be used in the widget.
      </p>
    </div>
  );
}
