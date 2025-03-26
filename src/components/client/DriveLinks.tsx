
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, LinkIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentLinkForm } from './drive-links/DocumentLinkForm';
import { DocumentLinksList } from './drive-links/DocumentLinksList';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { ValidationResult } from '@/utils/documentProcessing';
import { toast } from 'sonner';
import { DocumentLink, DocumentLinkFormData } from '@/types/document-processing';

interface DriveLinksProps {
  clientId: string;
  logClientActivity: (type: string, description: string, metadata?: any) => Promise<void>;
}

export const DriveLinks: React.FC<DriveLinksProps> = ({
  clientId,
  logClientActivity
}) => {
  const [activeTab, setActiveTab] = useState<string>('links');
  const { uploadFile, isUploading, progress } = useDocumentUpload();
  const { 
    documentLinks, 
    isLoading: isLinksLoading,
    error: linksError,
    addDocumentLink,
    deleteDocumentLink,
    validateDocumentLink,
    isValidating,
    refetchDocumentLinks
  } = useDocumentLinks(clientId);

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;
    
    const result = await uploadFile(file, clientId, documentType);
    
    if (result.success) {
      toast.success('File uploaded successfully');
      logClientActivity(
        'document_added',
        `Document uploaded: ${file.name}`,
        {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          storage_path: result.filePath,
          public_url: result.fileUrl
        }
      );
    } else {
      toast.error(`Upload failed: ${result.error}`);
    }
  };

  const handleAddLink = async (data: DocumentLinkFormData): Promise<ValidationResult> => {
    // First validate the link
    const validationResult = await validateDocumentLink(data.link);

    if (!validationResult.isValid) {
      return validationResult;
    }

    // Add the document link if validation passes
    const addResult = await addDocumentLink({
      ...data,
      document_type: data.document_type || 'file'
    });

    if (addResult.success) {
      toast.success('Document link added successfully');
      logClientActivity(
        'document_added',
        `Document link added: ${data.link}`,
        {
          link: data.link,
          document_type: data.document_type || 'file'
        }
      );
    } else {
      toast.error(`Failed to add document link: ${addResult.error}`);
    }

    return validationResult;
  };

  const handleDeleteLink = async (id: number) => {
    const link = documentLinks.find(l => l.id === id);
    
    if (!link) return;
    
    const result = await deleteDocumentLink(id);
    
    if (result.success) {
      toast.success('Document link removed');
      logClientActivity(
        'document_removed',
        `Document link removed: ${link.link}`,
        { id, link: link.link }
      );
    } else {
      toast.error(`Failed to remove document link: ${result.error}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="links" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="links" className="space-y-4">
          <DocumentLinkForm 
            onSubmit={handleAddLink}
            isSubmitting={isValidating}
          />
          <DocumentLinksList 
            links={documentLinks}
            isLoading={isLinksLoading}
            onDelete={handleDeleteLink}
          />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <DocumentUploadForm 
            onUpload={handleFileUpload}
            isUploading={isUploading}
            progress={progress}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
