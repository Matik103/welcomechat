
import React from 'react';
import { Card } from '@/components/ui/card';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ExtendedActivityType } from '@/types/extended-supabase';
import { Json } from '@/integrations/supabase/types';

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
    addDocumentLinkMutation,
    deleteDocumentLinkMutation
  } = useDocumentLinks(clientId);

  // Get document processing
  const {
    uploadDocumentMutation,
    isUploading
  } = useDocumentProcessing(clientId, agentName);

  /**
   * Enhanced addDocumentLink with activity logging
   */
  const addDocumentLink = async (data: { link: string; document_type: string; refresh_rate: number }) => {
    try {
      await addDocumentLinkMutation.mutateAsync(data);
      
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
  const deleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks?.find(link => link.id === linkId);
      await deleteDocumentLinkMutation.mutateAsync(linkId);
      
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
      await uploadDocumentMutation.mutateAsync(file);
      
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
        isValidating={false}
        isUploading={isUploading}
        addDocumentLink={addDocumentLink}
        deleteDocumentLink={deleteDocumentLink}
        uploadDocument={uploadDocument}
        isClientView={isClientView}
      />
    </Card>
  );
};
