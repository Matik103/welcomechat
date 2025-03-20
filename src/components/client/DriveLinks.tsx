
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentLinkForm } from '@/components/client/drive-links/DocumentLinkForm';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { DocumentUploadForm } from '@/components/client/drive-links/DocumentUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentNameWarning } from '@/components/client/drive-links/AgentNameWarning';
import { ExtendedActivityType } from '@/types/extended-supabase';
import { DocumentLink } from '@/hooks/useDocumentLinks';

interface DriveLinksProps {
  documents: DocumentLink[];
  isLoading: boolean;
  isValidating: boolean;
  isUploading: boolean;
  addDocumentLink: (data: { link: string; document_type: string; refresh_rate: number; }) => Promise<void>;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  isClientView?: boolean;
}

export const DriveLinks = ({
  documents,
  isLoading,
  isValidating,
  isUploading,
  addDocumentLink,
  deleteDocumentLink,
  uploadDocument,
  isClientView = false
}: DriveLinksProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const handleSubmitLink = async (data: { link: string; document_type: string; refresh_rate: number; }) => {
    await addDocumentLink(data);
    setShowAddForm(false);
  };

  const handleDeleteLink = async (linkId: number) => {
    await deleteDocumentLink(linkId);
  };

  const handleUploadDocument = async (file: File) => {
    await uploadDocument(file);
    setActiveTab('list');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Documents & Google Drive Links</CardTitle>
        {!showAddForm && (
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
              Add Link
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!isClientView && <AgentNameWarning />}

        {showAddForm ? (
          <div className="mb-4">
            <DocumentLinkForm
              onSubmit={handleSubmitLink}
              onCancel={() => setShowAddForm(false)}
              isValidating={isValidating}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Document Links</TabsTrigger>
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <DocumentLinksList
                documents={documents}
                isLoading={isLoading}
                onDelete={handleDeleteLink}
              />
            </TabsContent>

            <TabsContent value="upload">
              <DocumentUploadForm
                onUpload={handleUploadDocument}
                isUploading={isUploading}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
