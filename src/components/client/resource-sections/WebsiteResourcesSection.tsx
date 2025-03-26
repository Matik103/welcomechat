
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrlsList } from '@/components/client/website-urls/WebsiteUrlsList';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { WebsiteUrl } from '@/types/website-url';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

export interface WebsiteResourcesSectionProps {
  clientId: string;
  urls: WebsiteUrl[];
  isProcessing?: boolean;
  isDeleting?: boolean;
  refetchUrls?: () => void;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  urls,
  isProcessing = false,
  isDeleting = false,
  refetchUrls,
  onResourceChange,
  logClientActivity
}) => {
  const [addingUrl, setAddingUrl] = useState(false);
  
  const {
    addWebsiteUrl,
    deleteWebsiteUrl,
    processWebsiteUrl,
    isAddLoading,
    isDeleteLoading,
    isProcessLoading
  } = useWebsiteUrls(clientId);

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      setAddingUrl(true);
      await addWebsiteUrl(data);
      
      // Log activity
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${data.url}`,
        { url: data.url, refresh_rate: data.refresh_rate }
      );
      
      toast.success('Website URL added successfully');
      
      if (refetchUrls) {
        refetchUrls();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error('Failed to add website URL');
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    try {
      const urlToDelete = urls.find(u => u.id === urlId);
      
      await deleteWebsiteUrl(urlId);
      
      // Log activity
      if (urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          { url: urlToDelete.url }
        );
      }
      
      toast.success('Website URL deleted successfully');
      
      if (refetchUrls) {
        refetchUrls();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };

  const handleProcessWebsiteUrl = async (urlId: number) => {
    try {
      const urlToProcess = urls.find(u => u.id === urlId);
      
      await processWebsiteUrl(urlId);
      
      // Log activity
      if (urlToProcess) {
        await logClientActivity(
          'document_processing_started',
          `Started processing website: ${urlToProcess.url}`,
          { url: urlToProcess.url }
        );
      }
      
      toast.success('Website processing started');
      
      if (refetchUrls) {
        refetchUrls();
      }
    } catch (error) {
      console.error('Error processing website URL:', error);
      toast.error('Failed to process website');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
        <CardDescription>
          Add website URLs to be processed for your AI agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WebsiteUrlForm 
          onAdd={handleAddWebsiteUrl}
          isAddLoading={isAddLoading || addingUrl}
        />
        
        <WebsiteUrlsList 
          urls={urls}
          onDelete={handleDeleteWebsiteUrl}
          onProcess={handleProcessWebsiteUrl}
          isDeleteLoading={isDeleteLoading || isDeleting}
          isProcessing={isProcessLoading || isProcessing}
        />
      </CardContent>
    </Card>
  );
};

export default WebsiteResourcesSection;
