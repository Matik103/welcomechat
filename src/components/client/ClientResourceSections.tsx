
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { DocumentLinks } from '@/components/client/DocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { WebsiteResourcesSection } from '@/components/client/resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from '@/components/client/resource-sections/DocumentResourcesSection';
import { ActivityType } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export interface ClientResourceSectionsProps {
  clientId: string;
  agentName: string;
  className?: string;
  isClientView: boolean;
  logClientActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  agentName,
  className = '',
  isClientView,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const websiteUrlsState = useWebsiteUrls(clientId);
  const documentLinksState = useDocumentLinks(clientId);
  const documentProcessing = useDocumentProcessing({ clientId, agentName });

  if (!clientId) {
    return null;
  }

  // Destructure only the properties we need
  const { 
    websiteUrls, 
    refetchWebsiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isLoadingWebsiteUrls, 
    isError: isWebsiteUrlsError 
  } = websiteUrlsState;

  const { 
    documentLinks, 
    refetchDocumentLinks, 
    addDocumentLinkMutation, 
    deleteDocumentLinkMutation, 
    isLoading: isLoadingDocumentLinks, 
    isError: isDocumentLinksError 
  } = documentLinksState;

  // Create handlers for adding and deleting website URLs
  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
      await refetchWebsiteUrls();
      
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${data.url}`,
        { url: data.url }
      );
      
      return toast.success('Website URL added successfully');
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error('Failed to add website URL');
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    try {
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      await refetchWebsiteUrls();
      
      await logClientActivity(
        'website_url_deleted',
        'Website URL deleted',
        { url_id: urlId }
      );
      
      return toast.success('Website URL deleted successfully');
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };

  // Create handlers for adding and deleting document links
  const handleAddDocumentLink = async (data: { 
    link: string; 
    document_type: string; 
    refresh_rate: number 
  }) => {
    try {
      await addDocumentLinkMutation.mutateAsync({
        link: data.link,
        document_type: data.document_type || 'google_drive',
        refresh_rate: data.refresh_rate || 30
      });
      await refetchDocumentLinks();
      
      await logClientActivity(
        'drive_link_added',
        `Added ${data.document_type || 'document'} link: ${data.link}`,
        { link: data.link, type: data.document_type }
      );
      
      return toast.success('Document link added successfully');
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      await deleteDocumentLinkMutation.mutateAsync(linkId);
      await refetchDocumentLinks();
      
      await logClientActivity(
        'drive_link_deleted',
        'Document link deleted',
        { link_id: linkId }
      );
      
      return toast.success('Document link deleted successfully');
    } catch (error) {
      console.error('Error deleting document link:', error);
      toast.error('Failed to delete document link');
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File) => {
    try {
      await documentProcessing.uploadDocument(file);
      
      await logClientActivity(
        'document_uploaded',
        `Uploaded document: ${file.name}`,
        { 
          file_name: file.name, 
          file_size: file.size, 
          file_type: file.type 
        }
      );
      
      return toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  return (
    <div className={className}>
      <Tabs defaultValue="website-urls">
        <TabsList className="mb-4">
          <TabsTrigger value="website-urls">Website URLs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="website-urls">
          <WebsiteResourcesSection clientId={clientId} logActivity={logClientActivity}>
            <WebsiteUrls
              urls={websiteUrls}
              onAdd={handleAddWebsiteUrl}
              onDelete={handleDeleteWebsiteUrl}
              isLoading={isLoadingWebsiteUrls}
              isAdding={addWebsiteUrlMutation.isPending}
              isDeleting={deleteWebsiteUrlMutation.isPending}
              agentName={agentName}
            />
          </WebsiteResourcesSection>
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentResourcesSection clientId={clientId} logActivity={logClientActivity}>
            <DocumentLinks
              documentLinks={documentLinks}
              onAdd={handleAddDocumentLink}
              onDelete={handleDeleteDocumentLink}
              onUpload={handleDocumentUpload}
              isLoading={isLoadingDocumentLinks}
              isAdding={addDocumentLinkMutation.isPending}
              isDeleting={deleteDocumentLinkMutation.isPending}
              isUploading={documentProcessing.isUploading}
              uploadProgress={documentProcessing.progress}
              agentName={agentName}
            />
          </DocumentResourcesSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};
