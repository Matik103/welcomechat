
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface LogoUrlDisplayProps {
  logoUrl: string;
}

export function LogoUrlDisplay({ logoUrl }: LogoUrlDisplayProps) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [displayUrl, setDisplayUrl] = useState("");

  useEffect(() => {
    // Validate URL and prepare for display
    try {
      if (logoUrl) {
        new URL(logoUrl);
        setIsValidUrl(true);
        setDisplayUrl(logoUrl);
      } else {
        setIsValidUrl(false);
        setDisplayUrl("");
      }
    } catch (e) {
      console.error("Invalid logo URL:", logoUrl);
      setIsValidUrl(false);
      setDisplayUrl(logoUrl || "");
    }
  }, [logoUrl]);

  const handleCopy = () => {
    if (!isValidUrl) {
      toast.error("No valid URL to copy");
      return;
    }
    
    navigator.clipboard.writeText(logoUrl)
      .then(() => toast.success("URL copied to clipboard!"))
      .catch(err => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy URL");
      });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="logo-url">Public Logo URL</Label>
        {isValidUrl && (
          <Button 
            variant="ghost" 
            size="sm" 
            type="button" 
            onClick={handleCopy}
            className="px-2 h-8"
          >
            <Copy className="h-4 w-4 mr-1" />
            <span className="text-xs">Copy</span>
          </Button>
        )}
      </div>
      <Input
        id="logo-url"
        value={displayUrl}
        readOnly
        placeholder="No logo uploaded yet"
        className={isValidUrl ? "font-mono text-sm" : "text-muted-foreground italic"}
      />
      {!isValidUrl && logoUrl && (
        <p className="text-xs text-yellow-600">
          The stored logo URL appears to be invalid. Try uploading a new logo.
        </p>
      )}
    </div>
  );
}
