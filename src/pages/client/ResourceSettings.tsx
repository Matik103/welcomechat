
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useDriveLinks } from '@/hooks/useDriveLinks';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';
import { WebsiteUrls } from '@/components/client/website-urls';
import DriveLinks from '@/components/client/drive-links';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { createClientActivity } from '@/services/clientActivityService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { WebsiteUrlFormData } from '@/types/website-url';
import { DocumentLinkFormData } from '@/types/document-processing';

export default function ResourceSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const effectiveClientId = clientId || '';
  const [activeTab, setActiveTab] = useState('websites');
  const { goToClientDashboard } = useNavigation();
  
  // Website URLs
  const {
    websiteUrls,
    isLoading: isUrlsLoading,
    addWebsiteUrl,
    deleteWebsiteUrl,
    processWebsiteUrl,
    validateUrl,
    validateUrlError,
    isValidatingUrl,
    isProcessingUrl,
    processingUrlId,
    isDeletingUrl,
    deletingUrlId
  } = useWebsiteUrls(effectiveClientId);

  // Drive Links
  const {
    documentLinks,
    isLoading: isLinksLoading,
    addDocumentLink,
    deleteDocumentLink,
    isAddingLink,
    isDeletingLink,
    deletingLinkId
  } = useDriveLinks(effectiveClientId);

  // Document Upload
  const {
    isUploading,
    uploadDocument,
    uploadProgress
  } = useDocumentUpload(effectiveClientId);

  const handleAddWebsiteUrl = async (data: WebsiteUrlFormData) => {
    await addWebsiteUrl(data);
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    await deleteWebsiteUrl(urlId);
  };

  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number }) => {
    await addDocumentLink({
      link: data.link,
      refresh_rate: data.refresh_rate,
      document_type: 'google_drive' // Add default document_type
    });
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    await deleteDocumentLink(linkId);
  };

  const handleUploadDocument = async (file: File) => {
    try {
      const result = await uploadDocument(file);
      
      if (result) {
        await createClientActivity(
          effectiveClientId,
          "website_added", // Changed to a valid ActivityType
          `Uploaded document: ${file.name}`,
          { file_name: file.name, file_type: file.type, file_size: file.size }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error handling document upload:', error);
      return null;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={goToClientDashboard}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Resource Settings</h1>
        
        <Tabs 
          defaultValue="websites" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="websites">Website URLs</TabsTrigger>
            <TabsTrigger value="documents">Google Drive Links</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="websites" className="space-y-6">
            <WebsiteUrls
              urls={websiteUrls}
              onAdd={handleAddWebsiteUrl}
              onDelete={handleDeleteWebsiteUrl}
              isLoading={isUrlsLoading}
              isAdding={isValidatingUrl}
              isDeleting={isDeletingUrl}
              deletingUrlId={deletingUrlId}
              agentName="AI Assistant"
            />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <DriveLinks
              links={documentLinks}
              isLoading={isLinksLoading}
              addDocumentLink={handleAddDocumentLink}
              deleteDocumentLink={handleDeleteDocumentLink}
              isAddingLink={isAddingLink}
              isDeletingLink={isDeletingLink}
              deletingLinkId={deletingLinkId}
              agentName="AI Assistant"
            />
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-6">
            <DocumentUpload
              uploadDocument={handleUploadDocument}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
