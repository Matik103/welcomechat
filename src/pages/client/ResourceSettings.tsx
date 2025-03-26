
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { useClientActivity } from '@/hooks/useClientActivity';
import { ActivityType } from '@/types/client-form';
import { DocumentType } from '@/types/document-processing';

const ResourceSettings = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [openAddDocumentDialog, setOpenAddDocumentDialog] = useState(false);
  const { logClientActivity } = useClientActivity(clientId || '');
  
  const {
    documentLinks,
    addDocumentLink,
    deleteDocumentLink
  } = useDocumentLinks(clientId || '');

  // Handle adding a document link
  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number; document_type: string }) => {
    setIsAddingDocument(true);
    try {
      // Convert string document_type to DocumentType
      const docType = data.document_type as DocumentType;
      
      await addDocumentLink.mutateAsync({
        link: data.link,
        refresh_rate: data.refresh_rate,
        document_type: docType
      });
      toast.success('Document link added successfully');
      setOpenAddDocumentDialog(false);
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    } finally {
      setIsAddingDocument(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Resource Settings</h1>
      
      <ClientResourceSections 
        clientId={clientId || ''}
        onResourceChange={() => {}}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};

// Export ResourceSettings as default export
export default ResourceSettings;
