
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from './drive-links/DocumentLinkForm';
import { DocumentLinksList } from './drive-links/DocumentLinksList';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';

interface DriveLinksProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
  onUploadComplete?: () => void;
}

export const DriveLinks: React.FC<DriveLinksProps> = ({
  clientId,
  onResourceChange,
  logClientActivity,
  onUploadComplete
}) => {
  const [activeTab, setActiveTab] = useState('links');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    documentLinks,
    isLoading,
    error,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  } = useDocumentLinks(clientId);

  const {
    upload,
    isLoading: isUploading,
    uploadProgress
  } = useUnifiedDocumentUpload({
    clientId,
    onSuccess: () => {
      if (onUploadComplete) onUploadComplete();
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const handleAddLink = async (data: { link: string; refresh_rate: number; document_type: string }) => {
    try {
      const enhancedData = {
        ...data,
        document_type: (data.document_type || 'google_drive') as DocumentType
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

  const handleDriveUpload = async (file: File): Promise<void> => {
    try {
      const result = await upload(file);
      if (result?.success) {
        await logClientActivity();
      }
    } catch (error) {
      console.error('Drive upload failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="links">Google Drive Links</TabsTrigger>
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links">
            <div className="space-y-6">
              <DocumentLinkForm
                onSubmit={handleAddLink}
                isSubmitting={addDocumentLink.isPending}
                agentName="AI Assistant"
              />
              
              <DocumentLinksList
                links={documentLinks || []}
                onDelete={handleDeleteLink}
                isLoading={isLoading}
                isDeleting={deleteDocumentLink.isPending}
                deletingId={deletingId}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="upload">
            <DocumentUploadForm
              onSubmitDocument={handleDriveUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DriveLinks;
