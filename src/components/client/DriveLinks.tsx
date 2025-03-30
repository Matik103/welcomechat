
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from './drive-links/DocumentLinkForm';
import { DocumentLinksList } from './drive-links/DocumentLinksList';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { DocumentLinkFormData, DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';

interface DriveLinksProps {
  clientId: string;
  onResourceChange?: () => void;
}

export const DriveLinks: React.FC<DriveLinksProps> = ({ clientId, onResourceChange }) => {
  const [activeTab, setActiveTab] = useState('links');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    documentLinks,
    isLoading,
    error,
    addDocumentLink,
    deleteDocumentLink,
    isValidating,
    refetch
  } = useDocumentLinks(clientId);

  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  const handleAddLink = async (data: DocumentLinkFormData) => {
    try {
      // Ensure document_type is set with the correct type
      const enhancedData: DocumentLinkFormData = {
        ...data,
        document_type: (data.document_type || 'document') as DocumentType
      };
      
      await addDocumentLink.mutateAsync(enhancedData);
      toast.success('Document link added successfully');
      
      if (refetch) {
        await refetch();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add document link');
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    try {
      setDeletingId(linkId);
      await deleteDocumentLink.mutateAsync(linkId);
      toast.success('Document link deleted successfully');
      
      if (refetch) {
        await refetch();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete document link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadDocument = async (file: File) => {
    try {
      await uploadDocument(file);
      toast.success('Document uploaded successfully');
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="links">Document Links</TabsTrigger>
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
          </TabsList>
          <TabsContent value="links" className="space-y-4">
            <DocumentLinkForm
              onSubmit={handleAddLink}
              isSubmitting={addDocumentLink.isPending}
              agentName="AI Assistant"
            />
            <DocumentLinksList
              links={documentLinks}
              isLoading={isLoading}
              onDelete={handleDeleteLink}
              isDeleting={deleteDocumentLink.isPending}
              deletingId={deletingId}
            />
          </TabsContent>
          <TabsContent value="upload">
            <DocumentUploadForm
              onSubmitDocument={handleUploadDocument}
              isUploading={isUploading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DriveLinks;
