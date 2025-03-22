
import { WebsiteUrlsList } from "../website-urls";
import { WebsiteUrlForm } from "../website-urls/WebsiteUrlForm";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { WebsiteUrl } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

interface WebsiteResourcesSectionProps {
  clientId: string;
  agentName: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection = ({ 
  clientId, 
  agentName,
  isClientView = false,
  logClientActivity
}: WebsiteResourcesSectionProps) => {
  const {
    websiteUrls,
    isLoading,
    error,
    addWebsiteUrl,
    deleteWebsiteUrl,
    fetchWebsiteUrls,
    updateWebsiteUrlStatus
  } = useWebsiteUrls(clientId);

  const handleAddWebsiteUrl = async (url: string): Promise<boolean> => {
    const success = await addWebsiteUrl(url);
    
    if (success) {
      logClientActivity(
        "website_url_added",
        `Added website URL: ${url}`,
        { url }
      );
    }
    
    return success;
  };

  const handleDeleteWebsiteUrl = async (url: WebsiteUrl): Promise<void> => {
    await deleteWebsiteUrl(url.id);
    
    logClientActivity(
      "website_url_deleted",
      `Deleted website URL: ${url.url}`,
      { url: url.url }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <WebsiteUrlForm onSubmit={handleAddWebsiteUrl} isClientView={isClientView} />
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">
            Error loading website URLs: {error}
          </div>
        ) : (
          <WebsiteUrlsList 
            websiteUrls={websiteUrls} 
            onDelete={handleDeleteWebsiteUrl}
            onStatusUpdate={updateWebsiteUrlStatus}
            isLoading={isLoading}
            isClientView={isClientView}
          />
        )}
      </CardContent>
    </Card>
  );
};
