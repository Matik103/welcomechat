
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogoUrlDisplayProps {
  logoUrl: string;
  logoStoragePath?: string;
}

export function LogoUrlDisplay({ logoUrl, logoStoragePath }: LogoUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
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
      <Tabs defaultValue="public" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="public">Public URL</TabsTrigger>
          <TabsTrigger value="storage">Storage Path</TabsTrigger>
        </TabsList>
        
        <TabsContent value="public" className="mt-2">
          <div className="flex items-center gap-2">
            <Input 
              value={logoUrl || ''} 
              readOnly 
              placeholder="No public URL available"
              className={!isValidUrl && logoUrl ? "border-red-300" : ""}
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleCopy(logoUrl)}
              disabled={!isValidUrl}
              title={isValidUrl ? "Copy URL" : "Invalid URL"}
            >
              {copied && activeTab === "public" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {!isValidUrl && logoUrl && (
            <p className="text-sm text-red-500">Invalid URL format</p>
          )}
          {isValidUrl && logoUrl && (
            <p className="text-xs text-gray-500 break-all mt-1">
              {logoUrl}
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="storage" className="mt-2">
          <div className="flex items-center gap-2">
            <Input 
              value={logoStoragePath || ''} 
              readOnly 
              placeholder="No storage path available"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleCopy(logoStoragePath || '')}
              disabled={!logoStoragePath}
              title={logoStoragePath ? "Copy Path" : "No path available"}
            >
              {copied && activeTab === "storage" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {logoStoragePath && (
            <p className="text-xs text-gray-500 break-all mt-1">
              {logoStoragePath}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
