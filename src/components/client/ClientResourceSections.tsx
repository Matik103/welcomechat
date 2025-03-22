
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ActivityType } from '@/types/client';
import { Json } from '@/integrations/supabase/types';
import { ValidationResult, WebsiteUrlFormData } from '@/types/website-url';
import { DocumentLinkFormData } from '@/types/document-processing';

interface ClientResourceSectionsProps {
  clientId: string;
  agentName: string;
  className?: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  agentName,
  className = '',
  isClientView = false,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation
  } = useWebsiteUrls(clientId);

  const {
    documentLinks,
    isLoading: isLoadingDocs,
    addDocumentLink,
    deleteDocumentLink
  } = useDocumentLinks(clientId);

  const {
    handleDocumentUpload,
    isUploading
  } = useDocumentProcessing(clientId, agentName);

  const validateUrl = async (url: string): Promise<ValidationResult> => {
    setValidatingUrl(true);
    try {
      const result: ValidationResult = {
        isValid: true,
        message: "URL validated successfully",
        status: 'success'
      };
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating URL:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Failed to validate URL',
        status: 'error'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setValidatingUrl(false);
    }
  };

  const addWebsiteUrl = async (data: WebsiteUrlFormData) => {
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
      
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${data.url}`,
        {
          url: data.url,
          refresh_rate: data.refresh_rate
        }
      );
      
      return;
    } catch (error) {
      console.error('Error adding website URL:', error);
      throw error;
    }
  };

  const deleteWebsiteUrl = async (urlId: number) => {
    try {
      const urlToDelete = websiteUrls?.find(url => url.id === urlId);
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      
      if (urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          {
            url: urlToDelete.url,
            id: urlId
          }
        );
      }
      
      return;
    } catch (error) {
      console.error('Error deleting website URL:', error);
      throw error;
    }
  };

  const handleAddDocumentLink = async (data: DocumentLinkFormData) => {
    try {
      await addDocumentLink.mutateAsync(data);
      
      await logClientActivity(
        'document_link_added' as ActivityType, // Cast to ActivityType since it's in our type definition
        `Added ${data.document_type} link: ${data.link}`,
        {
          link: data.link,
          document_type: data.document_type,
          refresh_rate: data.refresh_rate
        }
      );
      
      return;
    } catch (error) {
      console.error('Error adding document link:', error);
      throw error;
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks?.find(link => link.id === linkId);
      await deleteDocumentLink.mutateAsync(linkId);
      
      if (linkToDelete) {
        await logClientActivity(
          'document_link_deleted' as ActivityType, // Cast to ActivityType
          `Deleted ${linkToDelete.document_type} link: ${linkToDelete.link}`,
          {
            link: linkToDelete.link,
            document_type: linkToDelete.document_type,
            id: linkId
          }
        );
      }
      
      return;
    } catch (error) {
      console.error('Error deleting document link:', error);
      throw error;
    }
  };

  const uploadDocument = async (file: File) => {
    try {
      await handleDocumentUpload(file);
      
      await logClientActivity(
        'document_uploaded',
        `Uploaded document: ${file.name}`,
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        }
      );
      
      return;
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
            urls={websiteUrls?.map(url => ({
              ...url,
              refresh_rate: url.refresh_rate || 30
            })) || []}
            isLoading={isLoadingUrls}
            onAdd={addWebsiteUrl}
            onDelete={deleteWebsiteUrl}
            isClientView={isClientView}
            isAdding={false}
            isDeleting={false}
            agentName={agentName}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DriveLinks
            documents={documentLinks || []}
            isLoading={isLoadingDocs}
            isUploading={isUploading}
            addDocumentLink={handleAddDocumentLink}
            deleteDocumentLink={handleDeleteDocumentLink}
            uploadDocument={uploadDocument}
            isClientView={isClientView}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
