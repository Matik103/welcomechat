
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from '@/components/client/website-urls/WebsiteUrlsList';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { WebsiteUrl } from '@/types/client';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

interface WebsiteResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
  websiteUrls?: WebsiteUrl[];
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity,
  websiteUrls: externalUrls
}) => {
  const [processingUrl, setProcessingUrl] = useState<number | null>(null);
  
  const {
    websiteUrls,
    isLoading,
    isError,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    refetchWebsiteUrls
  } = useWebsiteUrls(clientId);
  
  const { storeWebsiteContent, isStoring } = useStoreWebsiteContent();

  const urls = externalUrls || websiteUrls;

  const handleAddWebsiteUrl = async (url: string, refreshRate: number) => {
    try {
      await addWebsiteUrlMutation.mutateAsync({ url, refresh_rate: refreshRate });
      
      // Log the activity
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${url}`,
        { url, refresh_rate: refreshRate }
      );
      
      toast.success('Website URL added successfully');
      
      if (refetchWebsiteUrls) {
        refetchWebsiteUrls();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
      
      return true;
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error('Failed to add website URL');
      return false;
    }
  };
  
  const handleDeleteWebsiteUrl = async (id: number) => {
    try {
      const urlToDelete = urls.find(url => url.id === id);
      
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
      // Log the activity
      if (urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          { url: urlToDelete.url }
        );
      }
      
      toast.success('Website URL deleted successfully');
      
      if (refetchWebsiteUrls) {
        refetchWebsiteUrls();
      }
      
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };
  
  const handleProcessWebsite = async (url: WebsiteUrl) => {
    try {
      setProcessingUrl(url.id);
      
      if (!clientId) {
        toast.error('Client ID is missing');
        return;
      }
      
      // Create a compatible website object with scrapable property
      const websiteToProcess = {
        id: url.id,
        url: url.url,
        client_id: clientId,
        refresh_rate: url.refresh_rate || 30,
        scrapable: true // Add the required property
      };
      
      const result = await storeWebsiteContent(websiteToProcess, clientId);
      
      if (result.success) {
        toast.success(`Processed website content from ${url.url}`);
        
        // Log the activity
        await logClientActivity(
          'website_url_added',
          `Processed website URL: ${url.url}`,
          { 
            url: url.url, 
            urls_scraped: result.urlsScraped || 0,
            content_stored: result.contentStored || false
          }
        );
      } else {
        toast.error(`Failed to process ${url.url}: ${result.error}`);
      }
      
      if (refetchWebsiteUrls) {
        await refetchWebsiteUrls();
      }
    } catch (error) {
      console.error('Error processing website:', error);
      toast.error(`Error processing website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingUrl(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
        <CardDescription>
          Add website URLs to extract content for your AI assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WebsiteUrlForm
          onAdd={async (data) => {
            return handleAddWebsiteUrl(data.url, data.refresh_rate);
          }}
          isAdding={addWebsiteUrlMutation.isPending}
          agentName="AI Assistant"
        />
        
        <WebsiteUrlsList
          urls={urls}
          onDelete={handleDeleteWebsiteUrl}
          onProcess={handleProcessWebsite}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
          isProcessing={isStoring}
          deletingId={deleteWebsiteUrlMutation.variables as number | undefined}
        />
      </CardContent>
    </Card>
  );
};

export default WebsiteResourcesSection;
