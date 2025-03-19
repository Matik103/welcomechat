
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { WebsiteUrl } from "@/types/client";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

interface WebsiteResourcesSectionProps {
  websiteUrls: WebsiteUrl[];
  addWebsiteUrlMutation: any;
  deleteWebsiteUrlMutation: any;
  clientId: string;
  agentName: string | null | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection = ({
  websiteUrls,
  addWebsiteUrlMutation,
  deleteWebsiteUrlMutation,
  clientId,
  agentName,
  isClientView,
  logClientActivity
}: WebsiteResourcesSectionProps) => {
  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        throw new Error("Client ID is required to add a website URL");
      }
      
      console.log("Adding website URL:", data, "for client:", clientId);
      await addWebsiteUrlMutation.mutateAsync(data);
      
      if (isClientView) {
        try {
          await logClientActivity(
            "website_url_added", 
            "added a website URL", 
            { url: data.url, refresh_rate: data.refresh_rate }
          );
        } catch (logError) {
          console.error("Error logging website URL activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error adding website URL:", error);
      throw error;
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    try {
      const urlToDelete = websiteUrls.find(url => url.id === urlId);
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      
      if (isClientView && urlToDelete) {
        try {
          await logClientActivity(
            "url_deleted", 
            "removed a website URL", 
            { url: urlToDelete.url }
          );
        } catch (logError) {
          console.error("Error logging website URL deletion:", logError);
        }
      }
    } catch (error) {
      console.error("Error deleting website URL:", error);
      throw error;
    }
  };

  return (
    <div className="mt-8 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h3>
      <WebsiteUrls
        urls={websiteUrls}
        onAdd={handleAddWebsiteUrl}
        onDelete={handleDeleteWebsiteUrl}
        isAddLoading={addWebsiteUrlMutation.isPending}
        isDeleteLoading={deleteWebsiteUrlMutation.isPending}
        clientId={clientId}
        agentName={agentName || undefined}
      />
    </div>
  );
};
