
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { WebsiteUrlFormData } from "@/types/website-url";
import { toast } from "sonner";
import { createClientActivity } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";

interface WebsiteUrlsTabProps {
  clientId: string;
  agentName: string;
  onSuccess?: () => void;
}

export const WebsiteUrlsTab = ({ clientId, agentName, onSuccess }: WebsiteUrlsTabProps) => {
  const [newUrl, setNewUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    websiteUrls,
    isLoading,
    addWebsiteUrl,
    deleteWebsiteUrl,
    isAdding,
    isDeleting,
    refetchWebsiteUrls
  } = useWebsiteUrls(clientId);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    
    // Validate URL format
    const validation = FirecrawlService.validateUrl(newUrl);
    if (!validation.isValid) {
      toast.error(`Invalid URL: ${validation.error}`);
      return;
    }
    
    try {
      const urlData: WebsiteUrlFormData = {
        url: newUrl,
        refresh_rate: 24 // Default to 24 hours
      };
      
      await addWebsiteUrl({ ...urlData, client_id: clientId });
      
      // Log activity
      await createClientActivity(
        clientId,
        agentName,
        ActivityType.URL_ADDED,
        `Website URL added: ${newUrl}`,
        { url: newUrl }
      );
      
      toast.success("Website URL added successfully");
      setNewUrl("");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding URL:", error);
      toast.error(`Failed to add URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteUrl = async (urlId: number, url: string) => {
    if (confirm(`Are you sure you want to delete the URL: ${url}?`)) {
      try {
        await deleteWebsiteUrl(urlId);
        
        // Log activity
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.URL_REMOVED,
          `Website URL removed: ${url}`,
          { url }
        );
        
        toast.success("Website URL deleted successfully");
        
        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error deleting URL:", error);
        toast.error(`Failed to delete URL: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const handleProcessUrl = async (urlId: number, url: string) => {
    setIsProcessing(true);
    
    try {
      // Call the Firecrawl service to process the URL
      const result = await FirecrawlService.processDocument(
        url, 
        'website', 
        clientId, 
        agentName,
        urlId.toString(), 
        {
          limit: 100, // Limit to 100 pages
          maxDepth: 3,   // Max depth of 3 levels
          scrapeOptions: {
            formats: ['text', 'html'],
            onlyMainContent: true
          }
        }
      );

      if (result.success) {
        toast.success("Website processing started");
        
        // Log activity
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.URL_PROCESSED,
          `Website URL processing started: ${url}`,
          { url, job_id: result.data?.jobId }
        );
      } else {
        toast.error(`Failed to process website: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing URL:", error);
      toast.error(`Failed to process URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Website URLs</h3>
        <p className="text-sm text-muted-foreground">
          Add website URLs to train your AI assistant with web content.
        </p>
      </div>
      
      <Separator />
      
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          Website content will be processed and made available to your AI assistant.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleAddUrl} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="url">Website URL</Label>
          <div className="flex space-x-2">
            <Input
              id="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !newUrl.trim()}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add URL
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        <h4 className="font-medium">Added URLs</h4>
        
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading URLs...</p>
          </div>
        ) : websiteUrls && websiteUrls.length > 0 ? (
          <div className="space-y-2">
            {websiteUrls.map((websiteUrl) => (
              <div
                key={websiteUrl.id}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="truncate flex-1">
                  <p className="text-sm font-medium">{websiteUrl.url}</p>
                  <p className="text-xs text-muted-foreground">
                    Added: {new Date(websiteUrl.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProcessUrl(websiteUrl.id, websiteUrl.url)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Process"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteUrl(websiteUrl.id, websiteUrl.url)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">No website URLs added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
