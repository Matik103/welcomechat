
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { DocumentResourcesSection } from "@/components/client/resource-sections/DocumentResourcesSection";
import { WebsiteResourcesSection } from "@/components/client/resource-sections/WebsiteResourcesSection";
import { ActivityType, Json } from "@/integrations/supabase/types";
import { agentNameToClassName } from "@/utils/stringUtils";

interface ClientResourceSectionsProps {
  clientId: string;
  agentName?: string;
  className?: string;
  isClientView?: boolean;
  logClientActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  agentName = "AI Assistant",
  className = "",
  isClientView = false,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const [activeTab, setActiveTab] = useState("websites");
  const {
    websiteUrls,
    isLoading: isLoadingWebsites,
    error: websiteError,
    refetchWebsiteUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    isAdding: isAddingWebsite,
    isDeleting: isDeletingWebsite
  } = useWebsiteUrls(clientId);

  const {
    driveLinks,
    isLoading: isLoadingDriveLinks,
    error: driveLinksError,
    refetch: refetchDriveLinks,
    addDriveLink,
    deleteDriveLink,
    isAdding: isAddingDriveLink,
    isDeleting: isDeletingDriveLink
  } = useDriveLinks(clientId);

  const { uploadDocument, isUploading } = useDocumentProcessing(clientId, agentName);

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      await logClientActivity(
        "website_url_added",
        `Website URL added: ${data.url}`,
        {
          url: data.url,
          refresh_rate: data.refresh_rate,
          client_id: clientId
        }
      );
      
      return await addWebsiteUrlMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error adding website URL:", error);
      throw error;
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    return await deleteWebsiteUrlMutation.mutateAsync(urlId);
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number; document_type?: string }) => {
    try {
      await logClientActivity(
        "document_link_added",
        `Document link added: ${data.link}`,
        {
          link: data.link,
          refresh_rate: data.refresh_rate,
          document_type: data.document_type || 'google_drive',
          client_id: clientId
        }
      );
      
      return await addDriveLink(data);
    } catch (error) {
      console.error("Error adding drive link:", error);
      throw error;
    }
  };

  const handleDeleteDriveLink = async (linkId: number) => {
    return await deleteDriveLink(linkId);
  };

  const handleUploadDocument = async (data: { file: File; agentName: string }) => {
    try {
      const result = await uploadDocument(data.file, clientId, data.agentName);
      
      // Already logging activity in the uploadDocument function
      
      return result;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  const sanitizedClassName = agentNameToClassName(agentName);

  return (
    <div className={`space-y-6 ${className} ${sanitizedClassName}`}>
      <Tabs 
        defaultValue="websites" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="websites">Website URLs</TabsTrigger>
          <TabsTrigger value="documents">Document Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="websites" className="mt-6">
          <WebsiteResourcesSection 
            clientId={clientId}
            logActivity={logClientActivity}
          >
            <WebsiteUrls 
              urls={websiteUrls}
              onAdd={handleAddWebsiteUrl}
              onDelete={handleDeleteWebsiteUrl}
              isLoading={isLoadingWebsites}
              isAdding={isAddingWebsite}
              isDeleting={isDeletingWebsite}
              logActivity={logClientActivity}
            />
          </WebsiteResourcesSection>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          <DocumentResourcesSection 
            clientId={clientId}
            logActivity={logClientActivity}
            agentName={agentName}
          >
            <DriveLinks 
              driveLinks={driveLinks}
              onAdd={handleAddDriveLink}
              onDelete={handleDeleteDriveLink}
              onUpload={handleUploadDocument}
              isLoading={isLoadingDriveLinks}
              isAdding={isAddingDriveLink || isUploading}
              isDeleting={isDeletingDriveLink}
              agentName={agentName}
              logActivity={logClientActivity}
            />
          </DocumentResourcesSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};
