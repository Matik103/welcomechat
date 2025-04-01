
import React, { useEffect } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

interface ClientResourceSectionsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>; // Required callback
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
      
      // Log client activity
      await logClientActivity();
      
      // Also log specific document activity with client_id
      await createClientActivity(
        clientId,
        undefined,
        ActivityType.DOCUMENT_ADDED,
        `Document uploaded: ${file.name}`,
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          client_id: clientId
        }
      );
      
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
