
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { DriveLinks } from '@/components/client/DriveLinks';
import { useClient } from '@/hooks/useClient';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/useNavigation';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { logClientActivity } from '@/services/activityService';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

export default function ResourceSettings() {
  const { id } = useParams<{ id: string }>();
  const { client, isLoading: isClientLoading } = useClient(id as string);
  const { goToWidget } = useNavigation();
  
  // State for currently active tab
  const [activeTab, setActiveTab] = useState<'urls' | 'documents'>('urls');
  
  // Website URLs functionality
  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    refetchWebsiteUrls
  } = useWebsiteUrls(id as string);
  
  // Document links functionality
  const { 
    documentLinks, 
    isLoading: isLoadingDocuments,
    addDocumentLink,
    deleteDocumentLink,
    refetch: refetchDocuments
  } = useDocumentLinks(id as string);
  
  // Document upload functionality
  const { uploadDocument, isUploading } = useDocumentUpload(id as string);

  // Handle website URL operations
  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
      await logClientActivity(id as string, 'website_url_added', `Added website URL: ${data.url}`);
      refetchWebsiteUrls();
      toast.success('Website URL added successfully');
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error('Failed to add website URL');
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    try {
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      await logClientActivity(id as string, 'website_url_deleted', 'Deleted website URL');
      refetchWebsiteUrls();
      toast.success('Website URL deleted successfully');
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };

  // Handle document link operations
  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      await addDocumentLink.mutateAsync({
        link: data.link,
        refresh_rate: data.refresh_rate,
        document_type: 'document'
      });
      await logClientActivity(id as string, 'document_link_added', `Added document link: ${data.link}`);
      refetchDocuments();
      toast.success('Document link added successfully');
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      await deleteDocumentLink.mutateAsync(linkId);
      await logClientActivity(id as string, 'document_link_deleted', 'Deleted document link');
      refetchDocuments();
      toast.success('Document link deleted successfully');
    } catch (error) {
      console.error('Error deleting document link:', error);
      toast.error('Failed to delete document link');
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File) => {
    try {
      await uploadDocument(file);
      await logClientActivity(id as string, 'document_uploaded', `Uploaded document: ${file.name}`);
      refetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  if (isClientLoading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-screen">
          <Spinner />
        </div>
      </ClientLayout>
    );
  }

  if (!client) {
    return (
      <ClientLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold">Client Not Found</h1>
          <p className="mt-2">The requested client could not be found.</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Resource Settings</h1>
          <Button onClick={() => goToWidget(id as string)}>
            Widget Settings
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => setActiveTab('urls')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'urls'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500'
              }`}
            >
              Website URLs
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'documents'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500'
              }`}
            >
              Document Links
            </button>
          </div>
        </div>

        {activeTab === 'urls' ? (
          <WebsiteUrls
            urls={websiteUrls}
            isLoading={isLoadingUrls}
            onAdd={handleAddWebsiteUrl}
            onDelete={handleDeleteWebsiteUrl}
            isAdding={addWebsiteUrlMutation.isPending}
            isDeleting={deleteWebsiteUrlMutation.isPending}
            agentName="AI Assistant"
          />
        ) : (
          <div className="space-y-6">
            <DriveLinks
              isLoading={isLoadingDocuments}
              isUploading={isUploading}
              addDocumentLink={handleAddDocumentLink}
              deleteDocumentLink={handleDeleteDocumentLink}
              uploadDocument={handleDocumentUpload}
              isClientView={false}
              isValidating={false}
              deletingId={null}
              isDeleteLoading={false}
            />
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
