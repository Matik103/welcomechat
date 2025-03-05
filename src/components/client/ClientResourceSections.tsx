
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

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
  const { driveLinks, addDriveLinkMutation, deleteDriveLinkMutation } = useDriveLinks(clientId);
  const { websiteUrls, addWebsiteUrlMutation, deleteWebsiteUrlMutation } = useWebsiteUrls(clientId);

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    await addDriveLinkMutation.mutateAsync(data);
    
    // Log drive link addition activity
    if (isClientView) {
      await logClientActivity(
        "drive_link_added", 
        "added a Google Drive link", 
        { link: data.link, refresh_rate: data.refresh_rate }
      );
    }
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    await addWebsiteUrlMutation.mutateAsync(data);
    
    // Log website URL addition activity
    if (isClientView) {
      await logClientActivity(
        "website_url_added", 
        "added a website URL", 
        { url: data.url, refresh_rate: data.refresh_rate }
      );
    }
  };

  const handleDeleteDriveLink = async (linkId: number) => {
    const linkToDelete = driveLinks.find(link => link.id === linkId);
    await deleteDriveLinkMutation.mutate(linkId);
    
    // Log drive link deletion activity
    if (isClientView && linkToDelete) {
      await logClientActivity(
        "drive_link_deleted", 
        "removed a Google Drive link", 
        { link: linkToDelete.link }
      );
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    const urlToDelete = websiteUrls.find(url => url.id === urlId);
    await deleteWebsiteUrlMutation.mutate(urlId);
    
    // Log website URL deletion activity
    if (isClientView && urlToDelete) {
      await logClientActivity(
        "url_deleted", 
        "removed a website URL", 
        { url: urlToDelete.url }
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Share Links</h2>
        <DriveLinks
          driveLinks={driveLinks}
          onAdd={handleAddDriveLink}
          onDelete={handleDeleteDriveLink}
          isAddLoading={addDriveLinkMutation.isPending}
          isDeleteLoading={deleteDriveLinkMutation.isPending}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h2>
        <WebsiteUrls
          urls={websiteUrls}
          onAdd={handleAddWebsiteUrl}
          onDelete={handleDeleteWebsiteUrl}
          isAddLoading={addWebsiteUrlMutation.isPending}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
        />
      </div>
    </>
  );
};
