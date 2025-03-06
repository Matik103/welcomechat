
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface WebsiteUrlsSectionProps {
  clientId: string | undefined;
  websiteUrls: any[];
  addWebsiteUrlMutation: any;
  deleteWebsiteUrlMutation: any;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

const WebsiteUrlsSection = ({ 
  clientId, 
  websiteUrls = [], 
  addWebsiteUrlMutation, 
  deleteWebsiteUrlMutation,
  logClientActivity 
}: WebsiteUrlsSectionProps) => {
  
  // Handle adding a website URL
  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    if (!clientId) {
      toast.error("Cannot add URL: Client ID not found");
      return;
    }

    try {
      // Make sure to include the client_id in the data
      const dataWithClientId = {
        ...data,
        client_id: clientId
      };
      
      await addWebsiteUrlMutation.mutateAsync(dataWithClientId);
      
      await logClientActivity(
        "website_url_added", 
        "added a website URL", 
        { url: data.url }
      );
      
      toast.success("Website URL added successfully");
    } catch (error) {
      console.error("Error adding URL:", error);
      toast.error("Failed to add website URL");
      throw error; // Re-throw to be caught by the WebsiteUrls component
    }
  };

  // Handle deleting a website URL
  const handleDeleteUrl = async (id: number) => {
    try {
      const urlToDelete = websiteUrls.find(url => url.id === id);
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
      if (urlToDelete) {
        await logClientActivity(
          "url_deleted", 
          "removed a website URL", 
          { url: urlToDelete.url }
        );
      }
      
      toast.success("Website URL removed successfully");
    } catch (error) {
      console.error("Error deleting URL:", error);
      toast.error("Failed to remove website URL");
      throw error;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center gap-2">
        <Database className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Website URLs</CardTitle>
      </CardHeader>
      <CardContent>
        <WebsiteUrls
          urls={websiteUrls}
          onAdd={handleAddUrl}
          onDelete={handleDeleteUrl}
          isAddLoading={addWebsiteUrlMutation.isPending}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default WebsiteUrlsSection;
