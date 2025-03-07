
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface LogoUrlDisplayProps {
  logoUrl: string;
}

export function LogoUrlDisplay({ logoUrl }: LogoUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  
  useEffect(() => {
    if (logoUrl) {
      try {
        new URL(logoUrl);
        setIsValidUrl(true);
      } catch (e) {
        setIsValidUrl(false);
      }
    } else {
      setIsValidUrl(false);
    }
  }, [logoUrl]);

  const handleCopy = () => {
    if (!logoUrl) return;
    
    navigator.clipboard.writeText(logoUrl)
      .then(() => {
        setCopied(true);
        toast.success("Logo URL copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy URL:", err);
        toast.error("Failed to copy URL");
      });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input 
          value={logoUrl || ''} 
          readOnly 
          placeholder="No logo URL available"
          className={!isValidUrl && logoUrl ? "border-red-300" : ""}
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleCopy}
          disabled={!isValidUrl}
          title={isValidUrl ? "Copy URL" : "Invalid URL"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {!isValidUrl && logoUrl && (
        <p className="text-sm text-red-500">Invalid URL format</p>
      )}
      {isValidUrl && logoUrl && (
        <p className="text-xs text-gray-500 break-all">
          Logo URL: {logoUrl}
        </p>
      )}
    </div>
  );
}
