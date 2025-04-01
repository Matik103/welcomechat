
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from '@/components/client/drive-links/DocumentLinkForm';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { toast } from 'sonner';
import { DocumentType } from '@/types/document-processing';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

interface DocumentResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>; // No longer optional
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
      // Attempt to fix RLS policies automatically
      fixDocumentLinksRLS().catch(e => 
        console.error("Failed to fix RLS policies:", e)
      );
    }
    
    // Simulate initialization complete
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clientId, documentLinks, error]);

  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number; document_type?: string }) => {
    try {
      // Ensure document_type is properly typed as DocumentType
      const completeData = {
        ...data,
        document_type: (data.document_type || 'document') as DocumentType
      };
      
      console.log("Adding document link:", completeData, "for client:", clientId);
      await addDocumentLinkMutation.mutateAsync(completeData);
      
      // Log activity - now required
      try {
        await logClientActivity();
        
        // Also log specific document activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.URL_ADDED,
          `Document link added: ${data.link}`,
          {
            url: data.link,
            document_type: completeData.document_type
          }
        );
      } catch (activityError) {
        console.error("Failed to log client activity:", activityError);
        // Don't fail the operation but notify the user
        toast.warning("Document link added but activity logging failed");
      }
      
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
      
      // If we get an RLS error, try to fix it
      if (error instanceof Error && error.message.includes('violates row-level security policy')) {
        try {
          await fixDocumentLinksRLS();
          toast.info("Security policies were updated. Please try again.");
        } catch (rlsError) {
          console.error("Failed to fix RLS policies:", rlsError);
        }
      } else {
        toast.error(`Failed to add document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return Promise.reject(error);
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      await deleteDocumentLinkMutation.mutateAsync(linkId);
      
      // Log activity - now required
      try {
        await logClientActivity();
        
        // Also log specific document activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.DOCUMENT_REMOVED,
          `Document link removed`,
          {
            document_link_id: linkId
          }
        );
      } catch (activityError) {
        console.error("Failed to log client activity:", activityError);
        // Don't fail the operation but notify the user
        toast.warning("Document link deleted but activity logging failed");
      }
      
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
      
      // If we get an RLS error, try to fix it
      if (error instanceof Error && error.message.includes('violates row-level security policy')) {
        try {
          await fixDocumentLinksRLS();
          toast.info("Security policies were updated. Please try again.");
        } catch (rlsError) {
          console.error("Failed to fix RLS policies:", rlsError);
        }
      } else {
        toast.error(`Failed to delete document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
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
