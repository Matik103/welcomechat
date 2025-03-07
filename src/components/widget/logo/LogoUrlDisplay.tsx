
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LogoUrlDisplayProps {
  logoUrl: string;
}

export function LogoUrlDisplay({ logoUrl }: LogoUrlDisplayProps) {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [displayUrl, setDisplayUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Validate URL and prepare for display
    try {
      if (logoUrl) {
        new URL(logoUrl);
        setIsValidUrl(true);
        setDisplayUrl(logoUrl);
        console.log("Valid logo URL detected:", logoUrl);
      } else {
        setIsValidUrl(false);
        setDisplayUrl("");
        console.log("No logo URL provided");
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
      .then(() => {
        setCopied(true);
        toast.success("URL copied to clipboard!");
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy URL");
      });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="logo-url" className="flex items-center gap-2">
          Public Logo URL
          {isValidUrl && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {!isValidUrl && logoUrl && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </Label>
        {isValidUrl && (
          <Button 
            variant="ghost" 
            size="sm" 
            type="button" 
            onClick={handleCopy}
            className="px-2 h-8"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
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
      {isValidUrl && (
        <p className="text-xs text-green-600">
          This URL is automatically included in your embed code.
        </p>
      )}
    </div>
  );
}
