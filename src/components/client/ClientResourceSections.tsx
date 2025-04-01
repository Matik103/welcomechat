
import React, { useEffect, useState } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';

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
  const [isFixingRls, setIsFixingRls] = useState(false);
  const [hasRlsError, setHasRlsError] = useState(false);

  // Debug client ID to make sure it's being passed correctly
  useEffect(() => {
    console.log("ClientResourceSections rendered with clientId:", clientId);
  }, [clientId]);

  const handleFixPermissions = async () => {
    setIsFixingRls(true);
    try {
      const result = await fixDocumentLinksRLS();
      if (result.success) {
        toast.success("Security policies updated successfully");
        setHasRlsError(false);
      } else {
        toast.error("Failed to update security policies. Please contact support.");
      }
    } catch (error) {
      console.error("Failed to fix RLS policies:", error);
      toast.error("Failed to update security policies. Please contact support.");
    } finally {
      setIsFixingRls(false);
    }
  };

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
      setHasRlsError(true);
      
      // If we get an RLS error, try to fix it
      if (error instanceof Error && (
          error.message.includes('violates row-level security policy') ||
          error.message.includes('permission denied')
        )) {
        toast.error("Permission error. Use the 'Fix Security Permissions' button below.");
      } else {
        toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  return (
    <div className="space-y-8">
      {hasRlsError && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-yellow-800">Security Permission Issue Detected</h3>
                <p className="text-yellow-700 text-sm">
                  There appears to be a problem with database permissions. Click the button below to fix it.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleFixPermissions}
                  disabled={isFixingRls}
                  className="mt-2"
                >
                  {isFixingRls ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fixing Security Permissions...
                    </>
                  ) : (
                    'Fix Security Permissions'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
