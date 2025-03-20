
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ExtendedActivityType } from '@/types/extended-supabase';
import { Json } from '@/integrations/supabase/types';

interface DocumentResourcesSectionProps {
  clientId: string;
  agentName: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const DocumentResourcesSection = ({
  clientId,
  agentName,
  isClientView = false,
  logClientActivity
}: DocumentResourcesSectionProps) => {
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
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Documents & Links</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};
