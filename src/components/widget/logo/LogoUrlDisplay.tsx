
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface LogoUrlDisplayProps {
  logoUrl: string;
}

export function LogoUrlDisplay({ logoUrl }: LogoUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string>("");
  
  useEffect(() => {
    if (logoUrl) {
      try {
        new URL(logoUrl);
        setIsValidUrl(true);
        setDisplayUrl(logoUrl);
      } catch (e) {
        console.error("Invalid URL format:", logoUrl, e);
        setIsValidUrl(false);
        setDisplayUrl(logoUrl || "");
      }
    } else {
      setIsValidUrl(false);
      setDisplayUrl("");
    }
  }, [logoUrl]);

  const handleCopy = (text: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast.success("URL copied to clipboard");
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
          value={displayUrl} 
          readOnly 
          placeholder="No public URL available"
          className={!isValidUrl && displayUrl ? "border-red-300" : ""}
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => handleCopy(displayUrl)}
          disabled={!isValidUrl}
          title={isValidUrl ? "Copy URL" : "Invalid URL"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isValidUrl && displayUrl && (
        <p className="text-sm text-red-500">Invalid URL format</p>
      )}
      
      {isValidUrl && displayUrl && (
        <p className="text-xs text-gray-500 break-all mt-1">
          {displayUrl}
        </p>
      )}
      
      {isValidUrl && displayUrl && (
        <div className="mt-2">
          <p className="text-sm text-gray-700 mb-1">Logo Preview:</p>
          <div className="relative">
            <img 
              src={displayUrl} 
              alt="Logo Preview" 
              className="h-10 w-10 object-contain border border-gray-200 rounded"
              onError={(e) => {
                console.error("Error loading logo in URL display:", displayUrl);
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const errorMsg = document.createElement('p');
                errorMsg.className = "text-xs text-red-500";
                errorMsg.textContent = "Failed to load image";
                e.currentTarget.parentNode?.appendChild(errorMsg);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
