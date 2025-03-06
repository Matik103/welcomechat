import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientResourceSectionsProps {
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({ 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientResourceSectionsProps) => {
  if (!clientId) {
    console.error("ClientResourceSections: clientId is undefined");
    return null;
  }

  console.log("ClientResourceSections rendering with clientId:", clientId);

  const { driveLinks, addDriveLinkMutation, deleteDriveLinkMutation, isLoading: isDriveLoading, isError: isDriveError } = useDriveLinks(clientId);
  const { websiteUrls, addWebsiteUrlMutation, deleteWebsiteUrlMutation, isLoading: isUrlsLoading, isError: isUrlsError } = useWebsiteUrls(clientId);

  console.log("Drive Links:", driveLinks);
  console.log("Website URLs:", websiteUrls);

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to add a drive link");
        return;
      }
      
      console.log("Adding drive link:", data, "for client:", clientId);
      await addDriveLinkMutation.mutateAsync(data);
      
      if (isClientView) {
        try {
          await logClientActivity(
            "drive_link_added", 
            "added a Google Drive link", 
            { link: data.link, refresh_rate: data.refresh_rate }
          );
        } catch (logError) {
          console.error("Error logging drive link activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error adding drive link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add Google Drive link");
    }
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to add a website URL");
        return;
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
      toast.error(error instanceof Error ? error.message : "Failed to add website URL");
    }
  };

  const handleDeleteDriveLink = async (linkId: number) => {
    try {
      const linkToDelete = driveLinks.find(link => link.id === linkId);
      await deleteDriveLinkMutation.mutateAsync(linkId);
      
      if (isClientView && linkToDelete) {
        try {
          await logClientActivity(
            "drive_link_deleted", 
            "removed a Google Drive link", 
            { link: linkToDelete.link }
          );
        } catch (logError) {
          console.error("Error logging drive link deletion:", logError);
        }
      }
    } catch (error) {
      console.error("Error deleting drive link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete Google Drive link");
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
      toast.error(error instanceof Error ? error.message : "Failed to delete website URL");
    }
  };

  if (isDriveLoading || isUrlsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isDriveError || isUrlsError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          There was an error loading resources. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  const hasRestrictedFiles = driveLinks.some(link => link.access_status === 'restricted');

  return (
    <div className="space-y-6">
      {hasRestrictedFiles && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Some of your Google Drive links appear to be restricted. Please ensure all files are publicly accessible 
            (Anyone with the link can view) for our AI to process them.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Links</h3>
        <DriveLinks
          driveLinks={driveLinks}
          onAdd={handleAddDriveLink}
          onDelete={handleDeleteDriveLink}
          isAddLoading={addDriveLinkMutation.isPending}
          isDeleteLoading={deleteDriveLinkMutation.isPending}
        />
      </div>

      <div className="mt-8 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h3>
        <WebsiteUrls
          urls={websiteUrls}
          onAdd={handleAddWebsiteUrl}
          onDelete={handleDeleteWebsiteUrl}
          isAddLoading={addWebsiteUrlMutation.isPending}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
        />
      </div>
    </div>
  );
};
