
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from '@/components/client/drive-links/DocumentLinkForm';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { toast } from 'sonner';
import { DocumentLinkFormData, DocumentType } from '@/types/document-processing';

interface DocumentResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
}

export const DocumentResourcesSection: React.FC<DocumentResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const [initializing, setInitializing] = useState(true);
  
  const {
    documentLinks,
    isLoading,
    error,
    addDocumentLink: addDocumentLinkMutation,
    deleteDocumentLink: deleteDocumentLinkMutation,
    refetch
  } = useDocumentLinks(clientId);

  useEffect(() => {
    // Debug info
    console.log("DocumentResourcesSection rendered with clientId:", clientId);
    console.log("Document links:", documentLinks);
    
    if (error) {
      console.error("Error loading document links:", error);
    }
    
    // Simulate initialization complete
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clientId, documentLinks, error]);

  const handleAddDocumentLink = async (data: DocumentLinkFormData) => {
    try {
      // Ensure document_type is properly typed as DocumentType
      const completeData = {
        ...data,
        document_type: (data.document_type || 'document') as DocumentType
      };
      
      console.log("Adding document link:", completeData, "for client:", clientId);
      await addDocumentLinkMutation.mutateAsync(completeData);
      
      // Log the activity
      await logClientActivity();
      
      toast.success('Document link added successfully');
      
      if (refetch) {
        await refetch();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error(`Failed to add document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return Promise.reject(error);
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      await deleteDocumentLinkMutation.mutateAsync(linkId);
      
      // Log the activity
      await logClientActivity();
      
      toast.success('Document link deleted successfully');
      
      if (refetch) {
        await refetch();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting document link:', error);
      toast.error(`Failed to delete document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return Promise.reject(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Links</CardTitle>
        <CardDescription>
          Add document links from Google Drive, Sheets, or other sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentLinkForm
          onSubmit={handleAddDocumentLink}
          isSubmitting={addDocumentLinkMutation.isPending}
          agentName="AI Assistant"
        />
        
        {!initializing && (
          <DocumentLinksList
            links={documentLinks}
            isLoading={isLoading}
            onDelete={handleDeleteDocumentLink}
            isDeleting={deleteDocumentLinkMutation.isPending}
            deletingId={deleteDocumentLinkMutation.variables}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentResourcesSection;
