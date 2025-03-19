
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { useUrlAccessCheck, UrlAccessResult } from "@/hooks/useUrlAccessCheck";
import { useStoreWebsiteContent } from "@/hooks/useStoreWebsiteContent";
import { toast } from "sonner";
import { ValidationResult } from "./ValidationResult";
import { ScrapabilityInfo } from "./ScrapabilityInfo";

interface WebsiteUrlFormProps {
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onCancel: () => void;
  isAddLoading: boolean;
  clientId?: string;
  agentName?: string;
  isProcessing: boolean;
}

export const WebsiteUrlForm = ({
  onAdd,
  onCancel,
  isAddLoading,
  clientId,
  agentName,
  isProcessing,
}: WebsiteUrlFormProps) => {
  const [newUrl, setNewUrl] = useState("");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const { checkUrlAccess, isChecking, lastResult } = useUrlAccessCheck();
  const { storeWebsiteContent, isStoring } = useStoreWebsiteContent();
  const [isValidated, setIsValidated] = useState(false);
  const [isContentStored, setIsContentStored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value);
    setIsValidated(false);
    setIsContentStored(false);
    setError(null);
  };

  const validateUrl = async () => {
    if (!newUrl) {
      setError("Please enter a URL");
      return false;
    }

    try {
      new URL(newUrl);
    } catch (e) {
      setError("Please enter a valid URL");
      return false;
    }

    try {
      console.log("Validating URL:", newUrl);
      const result = await checkUrlAccess(newUrl);
      
      console.log("URL validation result:", result);
      
      if (!result.isAccessible) {
        setError(`URL is not accessible: ${result.error || "Unknown error"}`);
        return false;
      }
      
      setIsValidated(true);
      
      if (clientId && agentName && result.content) {
        try {
          console.log("Storing website content for:", { clientId, agentName, newUrl });
          const storeResult = await storeWebsiteContent(
            clientId,
            agentName,
            newUrl,
            result.content
          );
          
          if (storeResult.success) {
            setIsContentStored(true);
            toast.success("Website content imported to AI agent knowledge base");
          } else {
            console.warn("Could not store content:", storeResult.error);
          }
        } catch (storeError) {
          console.error("Error storing content:", storeError);
        }
      } else {
        console.warn("Not storing content due to missing clientId, agentName, or content", {
          hasClientId: !!clientId,
          hasAgentName: !!agentName,
          hasContent: !!result.content,
          contentLength: result.content?.length || 0
        });
      }
      
      return true;
    } catch (e) {
      console.error("Failed to validate URL:", e);
      setError("Failed to validate URL");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called with URL:", newUrl);
    setError(null);
    
    if (!isValidated) {
      const isValid = await validateUrl();
      if (!isValid) return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting website URL:", newUrl, newRefreshRate);
      
      await onAdd({
        url: newUrl,
        refresh_rate: newRefreshRate,
      });
    } catch (error) {
      console.error("Error adding URL:", error);
      setError(error instanceof Error ? error.message : "Failed to add URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProcessingText = () => {
    if (isProcessing) {
      // For website URLs, we always use Firecrawl
      return "Processing with Firecrawl...";
    }
    
    if (isStoring) {
      return "Importing...";
    }
    
    if (isAddLoading || isSubmitting) {
      return "Adding...";
    }
    
    return "Add URL";
  };

  return (
    <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <ValidationResult error={error} isValidated={isValidated} lastResult={lastResult} />
        <ScrapabilityInfo 
          lastResult={lastResult as UrlAccessResult} 
          isValidated={isValidated} 
          isContentStored={isContentStored} 
        />
        
        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <div className="flex gap-2">
            <Input
              id="website-url"
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={handleUrlChange}
              required
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={validateUrl}
              disabled={isChecking || !newUrl || isValidated}
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Validate
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter complete URL including https:// (e.g., https://example.com)
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
          <Input
            id="refresh-rate"
            type="number"
            min="1"
            value={newRefreshRate}
            onChange={(e) => setNewRefreshRate(parseInt(e.target.value))}
            required
          />
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isAddLoading || isSubmitting || !newUrl || (isChecking && !isValidated) || isProcessing}
          >
            {(isAddLoading || isSubmitting || isProcessing || isStoring) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {getProcessingText()}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add URL
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
