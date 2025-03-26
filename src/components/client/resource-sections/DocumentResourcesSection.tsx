
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from '@/components/client/drive-links/DocumentLinkForm';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

export interface DocumentResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const DocumentResourcesSection: React.FC<DocumentResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    documentLinks,
    addLink,
    deleteLink,
    isLoading,
    isAddingLink,
    isDeletingLink,
    refetch
  } = useDocumentLinks(clientId);

  const handleAddLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      setIsAdding(true);
      await addLink(data);
      
      // Log activity
      await logClientActivity(
        'document_link_added',
        `Added document link: ${data.link}`,
        { link: data.link, refresh_rate: data.refresh_rate }
      );
      
      toast.success('Document link added successfully');
      refetch();
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks.find(l => l.id === linkId);
      
      await deleteLink(linkId);
      
      // Log activity
      if (linkToDelete) {
        await logClientActivity(
          'document_link_deleted',
          `Deleted document link: ${linkToDelete.link}`,
          { link: linkToDelete.link }
        );
      }
      
      toast.success('Document link deleted successfully');
      refetch();
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error deleting document link:', error);
      toast.error('Failed to delete document link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Links</CardTitle>
        <CardDescription>
          Add Google Drive links to be processed for your AI agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentLinkForm 
          clientId={clientId}
          onSubmit={handleAddLink}
          isSubmitting={isAddingLink || isAdding}
        />
        
        <DocumentLinksList 
          links={documentLinks}
          isLoading={isLoading}
          onDelete={handleDeleteLink}
          isDeleting={isDeletingLink}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentResourcesSection;
