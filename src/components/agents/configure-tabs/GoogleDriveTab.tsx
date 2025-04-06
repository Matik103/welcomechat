
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentLinkForm } from '@/components/client/drive-links/DocumentLinkForm';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { DocumentLinkData, DocumentLinksProps } from '@/components/client/DocumentLinks';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';

interface GoogleDriveTabProps {
  clientId: string;
  onResourceChange?: () => void;
  onUploadComplete?: () => void;
}

export function GoogleDriveTab({ clientId, onResourceChange, onUploadComplete }: GoogleDriveTabProps) {
  const {
    documentLinks,
    isLoading,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  } = useDocumentLinks(clientId);

  const logClientActivity = async () => {
    // This is a placeholder; in a real implementation, you'd log the activity
    console.log('Document link activity logged for client:', clientId);
    return Promise.resolve();
  };

  const handleAddLink = async (data: DocumentLinkData) => {
    try {
      await addDocumentLink.mutateAsync(data);
      
      if (refetch) await refetch();
      if (onResourceChange) onResourceChange();
    } catch (error) {
      console.error('Failed to add link:', error);
    }
  };

  const handleDeleteLink = async (id: number) => {
    try {
      await deleteDocumentLink.mutateAsync(id);
      
      if (refetch) await refetch();
      if (onResourceChange) onResourceChange();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Connect a Google Drive document or folder to provide knowledge for the AI agent.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
