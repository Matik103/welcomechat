
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ExtendedActivityType } from '@/types/extended-supabase';
import { Json } from '@/integrations/supabase/types';

interface ClientResourceSectionsProps {
  clientId: string;
  agentName: string;
  className?: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  agentName,
  className = '',
  isClientView = false,
  logClientActivity
}: ClientResourceSectionsProps) => {
  // Wrap URL operations for notification and activity logging
  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    validateUrl,
    isValidating: isValidatingUrl,
    addWebsiteUrl: rawAddWebsiteUrl,
    deleteWebsiteUrl: rawDeleteWebsiteUrl,
    validationResult
  } = useWebsiteUrls(clientId);

  // Wrap document link operations for notification and activity logging
  const {
    documentLinks,
    isLoading: isLoadingDocs,
    isValidating: isValidatingDoc,
    addDocumentLink: rawAddDocumentLink,
    deleteDocumentLink: rawDeleteDocumentLink
  } = useDocumentLinks(clientId);

  // Wrap document processing operations for notification and activity logging
  const {
    uploadDocument: rawUploadDocument,
    isUploading
  } = useDocumentProcessing(clientId, agentName);

  /**
   * Enhanced addWebsiteUrl with activity logging
   */
  const addWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      const result = await rawAddWebsiteUrl.mutateAsync(data);
      
      if (result) {
        await logClientActivity(
          'website_url_added',
          `Added website URL: ${data.url}`,
          {
            url: data.url,
            refresh_rate: data.refresh_rate
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error adding website URL:', error);
      throw error;
    }
  };

  /**
   * Enhanced deleteWebsiteUrl with activity logging
   */
  const deleteWebsiteUrl = async (urlId: number) => {
    try {
      const urlToDelete = websiteUrls?.find(url => url.id === urlId);
      const result = await rawDeleteWebsiteUrl.mutateAsync(urlId);
      
      if (result && urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          {
            url: urlToDelete.url,
            id: urlId
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting website URL:', error);
      throw error;
    }
  };

  /**
   * Enhanced addDocumentLink with activity logging
   */
  const addDocumentLink = async (data: { link: string; document_type: string; refresh_rate: number }) => {
    try {
      const result = await rawAddDocumentLink.mutateAsync(data);
      
      if (result) {
        await logClientActivity(
          'document_link_added',
          `Added ${data.document_type} link: ${data.link}`,
          {
            link: data.link,
            document_type: data.document_type,
            refresh_rate: data.refresh_rate
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error adding document link:', error);
      throw error;
    }
  };

  /**
   * Enhanced deleteDocumentLink with activity logging
   */
  const deleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks?.find(link => link.id === linkId);
      const result = await rawDeleteDocumentLink.mutateAsync(linkId);
      
      if (result && linkToDelete) {
        await logClientActivity(
          'document_link_deleted',
          `Deleted ${linkToDelete.document_type} link: ${linkToDelete.link}`,
          {
            link: linkToDelete.link,
            document_type: linkToDelete.document_type,
            id: linkId
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting document link:', error);
      throw error;
    }
  };

  /**
   * Enhanced uploadDocument with activity logging
   */
  const uploadDocument = async (file: File) => {
    try {
      const result = await rawUploadDocument.mutateAsync(file);
      
      if (result) {
        await logClientActivity(
          'document_uploaded',
          `Uploaded document: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  return (
    <div className={className}>
      <Tabs defaultValue="websites" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="websites" className="flex-1">
            Website URLs
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">
            Documents &amp; Drive Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="websites">
          <WebsiteUrls
            urls={websiteUrls || []}
            isLoading={isLoadingUrls}
            isValidating={isValidatingUrl}
            validationResult={validationResult}
            validateUrl={validateUrl}
            addWebsiteUrl={addWebsiteUrl}
            deleteWebsiteUrl={deleteWebsiteUrl}
            isClientView={isClientView}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DriveLinks
            documents={documentLinks || []}
            isLoading={isLoadingDocs}
            isValidating={isValidatingDoc}
            isUploading={isUploading}
            addDocumentLink={addDocumentLink}
            deleteDocumentLink={deleteDocumentLink}
            uploadDocument={uploadDocument}
            isClientView={isClientView}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
