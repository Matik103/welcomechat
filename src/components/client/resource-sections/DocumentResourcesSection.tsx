
import React from 'react';
import { Card } from '@/components/ui/card';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ExtendedActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';
import { DocumentLinkFormData } from '@/types/document-processing';

interface DocumentResourcesSectionProps {
  clientId: string;
  agentName: string;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const DocumentResourcesSection: React.FC<DocumentResourcesSectionProps> = ({
  clientId,
  agentName,
  isClientView,
  logClientActivity
}) => {
  // Get document links
  const {
    documentLinks,
    isLoading: isLoadingDocs,
    addDocumentLink,
    deleteDocumentLink
  } = useDocumentLinks(clientId);

  // Get document processing
  const {
    handleDocumentUpload,
    isUploading
  } = useDocumentProcessing(clientId, agentName);

  /**
   * Enhanced addDocumentLink with activity logging
   */
  const handleAddDocumentLink = async (data: DocumentLinkFormData) => {
    try {
      await addDocumentLink.mutateAsync(data);
      
      await logClientActivity(
        'document_link_added',
        `Added ${data.document_type} link: ${data.link}`,
        {
          link: data.link,
          document_type: data.document_type,
          refresh_rate: data.refresh_rate
        }
      );
    } catch (error) {
      console.error('Error adding document link:', error);
      throw error;
    }
  };

  /**
   * Enhanced deleteDocumentLink with activity logging
   */
  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks?.find(link => link.id === linkId);
      await deleteDocumentLink.mutateAsync(linkId);
      
      if (linkToDelete) {
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
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  return (
    <Card className="p-0">
      <DriveLinks
        documents={documentLinks || []}
        isLoading={isLoadingDocs}
        isUploading={isUploading}
        addDocumentLink={handleAddDocumentLink}
        deleteDocumentLink={handleDeleteDocumentLink}
        uploadDocument={uploadDocument}
        isClientView={isClientView}
      />
    </Card>
  );
};
