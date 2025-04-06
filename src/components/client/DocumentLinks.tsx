import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from './drive-links/DocumentLinkForm';
import { DocumentLinksList } from './drive-links/DocumentLinksList';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';
import { useUnifiedDocumentUpload, UploadProgress } from '@/hooks/useUnifiedDocumentUpload';

export interface DocumentLinkData {
  link: string;
  refresh_rate: number;
  document_type: DocumentType;
}

export interface DocumentLinksProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
  onUploadComplete?: () => void;
}

export function DocumentLinks({ 
  clientId, 
  onResourceChange,
  logClientActivity,
  onUploadComplete
}: DocumentLinksProps) {
  const {
    documentLinks,
    isLoading,
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

  const handleAddLink = async (data: DocumentLinkData) => {
    try {
      await addDocumentLink.mutateAsync(data);
      
      if (refetch) await refetch();
      if (onResourceChange) onResourceChange();
    } catch (error) {
      toast.error(`Failed to add link: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteLink = async (id: number) => {
    try {
      await deleteDocumentLink.mutateAsync(id);
      
      if (refetch) await refetch();
      if (onResourceChange) onResourceChange();
    } catch (error) {
      toast.error(`Failed to delete link: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      const result = await upload(file);
      if (result?.success) {
        await logClientActivity();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Google Drive Links</TabsTrigger>
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links" className="pt-4">
            <DocumentLinkForm 
              onSubmit={handleAddLink} 
              isSubmitting={addDocumentLink.isPending}
              agentName="AI Assistant"
            />
            <div className="h-4" />
            <DocumentLinksList 
              links={documentLinks || []} 
              isLoading={isLoading}
              onDelete={handleDeleteLink}
              isDeleting={deleteDocumentLink.isPending}
              deletingId={deleteDocumentLink.variables}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="pt-4">
            <DocumentUploadForm
              onSubmitDocument={handleDocumentUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
