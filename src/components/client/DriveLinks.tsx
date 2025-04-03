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
import { uploadDocumentToStorage } from '@/utils/documentConverter';
import { supabase } from '@/lib/supabase';

interface DriveLinksProps {
  clientId: string;
  onResourceChange?: () => void;
}

export const DriveLinks: React.FC<DriveLinksProps> = ({ clientId, onResourceChange }) => {
  const [activeTab, setActiveTab] = useState('links');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    documentLinks,
    isLoading,
    error,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  } = useDocumentLinks(clientId);

  const handleAddLink = async (data: { link: string; refresh_rate: number; document_type: string }) => {
    try {
      // Ensure document_type is set with the correct type
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

  const handleUploadDocument = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // First, upload to storage
      const uploadResult = await uploadDocumentToStorage(file, clientId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Get the file data as base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(file);
      });

      // Call the Edge Function to process the document
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'upload-file-to-openai',
        {
          body: {
            client_id: clientId,
            file_data: fileData,
            file_name: file.name,
            file_type: file.type
          }
        }
      );

      if (processError) {
        throw new Error(`Failed to process document: ${processError.message}`);
      }

      clearInterval(progressInterval);
      
      // Add the document link to the database
      await addDocumentLink.mutateAsync({
        link: uploadResult.url || '',
        document_type: (file.type.includes('pdf') ? 'pdf' : 'document') as DocumentType,
        refresh_rate: 24
      });
      
      setUploadProgress(100);
      toast.success('Document uploaded and processed successfully');
      
      if (refetch) {
        await refetch();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
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
              uploadProgress={uploadProgress}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DriveLinks;
