
import React, { useEffect } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';

interface ClientResourceSectionsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  onResourceChange,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  // Debug client ID to make sure it's being passed correctly
  useEffect(() => {
    console.log("ClientResourceSections rendered with clientId:", clientId);
  }, [clientId]);

  const handleUploadDocument = async (file: File) => {
    try {
      console.log("Uploading document for client:", clientId);
      await uploadDocument(file);
      toast.success('Document uploaded successfully');
      
      // Log activity
      await logClientActivity();
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <div className="space-y-8">
      <WebsiteResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <DocumentResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, Word, or text documents to enhance your AI assistant's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm
            onSubmitDocument={handleUploadDocument}
            isUploading={isUploading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientResourceSections;
