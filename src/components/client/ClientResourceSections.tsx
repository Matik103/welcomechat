
import React, { useEffect } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';

interface ClientResourceSectionsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity?: () => Promise<void>; // Made optional to prevent dependency on activity
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
    
    // Initialize RLS policies for document_links on component mount
    fixDocumentLinksRLS().catch(e => 
      console.error("Failed to initialize RLS policies:", e)
    );
  }, [clientId]);

  const handleUploadDocument = async (file: File) => {
    try {
      console.log("Uploading document for client:", clientId);
      await uploadDocument(file);
      toast.success('Document uploaded successfully');
      
      // Log activity if the function is provided, but don't make it required
      if (logClientActivity) {
        try {
          await logClientActivity();
        } catch (activityError) {
          // Just log the error but don't fail the operation if activity logging fails
          console.error("Failed to log client activity:", activityError);
        }
      }
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // If we get an RLS error, try to fix it
      if (error instanceof Error && error.message.includes('violates row-level security policy')) {
        try {
          await fixDocumentLinksRLS();
          toast.info("Security policies were updated. Please try again.");
        } catch (rlsError) {
          console.error("Failed to fix RLS policies:", rlsError);
        }
      } else {
        toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
