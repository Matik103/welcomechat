
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
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

interface DocumentResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>; // Required callback
}

export const DocumentResourcesSection: React.FC<DocumentResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const [isFixingRls, setIsFixingRls] = useState(false);
  
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
    
    if (error) {
      console.error("Error loading document links:", error);
    }
  }, [clientId, error]);

  const handleFixPermissions = async () => {
    setIsFixingRls(true);
    try {
      const result = await fixDocumentLinksRLS();
      
      if (result.success) {
        toast.success("Security permissions fixed successfully");
      } else {
        toast.error(`Failed to fix permissions: ${result.message}`);
      }
      
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      toast.error("Failed to fix permissions. Please contact support.");
    } finally {
      setIsFixingRls(false);
    }
  };

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
            document_type: completeData.document_type,
            client_id: clientId
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
      
      // If we get an RLS error, show a more helpful message and button
      if (error instanceof Error && 
         (error.message.includes('violates row-level security policy') || 
          error.message.includes('permission denied'))) {
        toast.error("Permission error. Try using the 'Fix Permissions' button below.");
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
            document_link_id: linkId,
            client_id: clientId
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
      
      // If we get an RLS error, show a more helpful message
      if (error instanceof Error && 
         (error.message.includes('violates row-level security policy') || 
          error.message.includes('permission denied'))) {
        toast.error("Permission error. Try using the 'Fix Permissions' button below.");
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
        
        {error && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 my-4">
            <p className="text-yellow-800 font-medium mb-2">
              Error loading document links. Click the button below to fix permissions.
            </p>
            <Button 
              variant="outline" 
              onClick={handleFixPermissions}
              disabled={isFixingRls}
              className="flex items-center gap-2"
            >
              {isFixingRls ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fixing permissions...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Fix Permissions
                </>
              )}
            </Button>
          </div>
        )}
        
        <DocumentLinksList
          links={documentLinks}
          isLoading={isLoading}
          onDelete={handleDeleteDocumentLink}
          isDeleting={deleteDocumentLinkMutation.isPending}
          deletingId={deleteDocumentLinkMutation.variables}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentResourcesSection;
