
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { DocumentLinks } from "@/components/client/DocumentLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const { 
    documentLinks,
    addDriveLinkMutation, 
    deleteDriveLinkMutation,
    uploadDocumentMutation,
    isLoading: isDriveLoading 
  } = useDriveLinks(clientId);
  
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading 
  } = useWebsiteUrls(clientId);

  console.log("Document Links:", documentLinks);
  console.log("Website URLs:", websiteUrls);

  // Get the client's agent name (we need to fetch this from the client data)
  // For now, we'll access it from the current client data in the localStorage or context
  const getAgentName = (): string | undefined => {
    try {
      // Try to get the agent name from localStorage (this is just one approach)
      const clientDataStr = localStorage.getItem('client_data');
      if (clientDataStr) {
        const clientData = JSON.parse(clientDataStr);
        return clientData.agent_name;
      }
      return undefined;
    } catch (e) {
      console.error("Error getting agent name:", e);
      return undefined;
    }
  };

  const agentName = getAgentName();

  // Check if any document links have restricted access
  const restrictedLinks = documentLinks.filter(link => link.access_status === "restricted");
  const hasRestrictedLinks = restrictedLinks.length > 0;

  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number; document_type?: string }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to add a document link");
        return;
      }
      
      console.log("Adding document link:", data, "for client:", clientId);
      await addDriveLinkMutation.mutateAsync(data);
      
      if (isClientView) {
        try {
          await logClientActivity(
            "document_link_added", 
            "added a document link", 
            { link: data.link, refresh_rate: data.refresh_rate, document_type: data.document_type }
          );
        } catch (logError) {
          console.error("Error logging document link activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error adding document link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add document link");
    }
  };

  const handleUploadDocument = async (file: File, agentName: string) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to upload a document");
        return;
      }
      
      console.log("Uploading document for client:", clientId, "agent:", agentName);
      await uploadDocumentMutation.mutateAsync({ file, agentName });
      
      if (isClientView) {
        try {
          await logClientActivity(
            "document_uploaded", 
            "uploaded a document to the knowledge base", 
            { filename: file.name, filesize: file.size, filetype: file.type }
          );
        } catch (logError) {
          console.error("Error logging document upload activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
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

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks.find(link => link.id === linkId);
      await deleteDriveLinkMutation.mutateAsync(linkId);
      
      if (isClientView && linkToDelete) {
        try {
          await logClientActivity(
            "document_link_deleted", 
            "removed a document link", 
            { link: linkToDelete.link }
          );
        } catch (logError) {
          console.error("Error logging document link deletion:", logError);
        }
      }
    } catch (error) {
      console.error("Error deleting document link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete document link");
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

  return (
    <div className="space-y-6">
      <div className="rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Sources</h3>
        
        {hasRestrictedLinks && (
          <Alert variant="warning" className="mb-4 border-amber-300 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Restricted Access Detected</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">
                {restrictedLinks.length > 1 
                  ? `${restrictedLinks.length} document links have restricted access.` 
                  : "One document link has restricted access."} 
                Your AI agent cannot access these files.
              </p>
              <p className="text-sm">
                To fix this: For Google Drive links, open each restricted link, click "Share", and change access to "Anyone with the link".
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <DocumentLinks
          documentLinks={documentLinks}
          onAdd={handleAddDocumentLink}
          onDelete={handleDeleteDocumentLink}
          onUpload={handleUploadDocument}
          isAddLoading={addDriveLinkMutation.isPending}
          isDeleteLoading={deleteDriveLinkMutation.isPending}
          isUploadLoading={uploadDocumentMutation.isPending}
          agentName={agentName}
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
          clientId={clientId}
          agentName={agentName}
        />
      </div>
    </div>
  );
};
