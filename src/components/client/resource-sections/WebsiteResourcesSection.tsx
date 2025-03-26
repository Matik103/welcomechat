
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from '@/components/client/website-urls/WebsiteUrlsList';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { WebsiteUrl } from '@/types/website-url';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

interface WebsiteResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const [processingUrl, setProcessingUrl] = useState<number | null>(null);
  
  const {
    websiteUrls,
    isLoading,
    error,
    addWebsiteUrl,
    deleteWebsiteUrl,
    refetch
  } = useWebsiteUrls(clientId);
  
  const { storeWebsiteContent, isProcessing } = useStoreWebsiteContent();

  const handleAddWebsiteUrl = async (url: string, refreshRate: number) => {
    try {
      await addWebsiteUrl.mutateAsync({ url, refreshRate });
      
      // Log the activity
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${url}`,
        { url, refresh_rate: refreshRate }
      );
      
      toast.success('Website URL added successfully');
      
      if (refetch) {
        refetch();
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
      const urlToDelete = websiteUrls.find(url => url.id === id);
      
      await deleteWebsiteUrl.mutateAsync(id);
      
      // Log the activity
      if (urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          { url: urlToDelete.url }
        );
      }
      
      toast.success('Website URL deleted successfully');
      
      if (refetch) {
        refetch();
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
      
      // Create a compatible website object
      const websiteToProcess = {
        id: url.id,
        url: url.url,
        scrapable: true,
        client_id: clientId
      };
      
      const result = await storeWebsiteContent(websiteToProcess);
      
      if (result.success) {
        toast.success(`Processed ${result.urlsScraped} pages from ${url.url}`);
        
        // Log the activity
        await logClientActivity(
          'website_url_added',
          `Processed website URL: ${url.url}`,
          { 
            url: url.url, 
            urls_scraped: result.urlsScraped,
            content_stored: result.contentStored
          }
        );
      } else {
        toast.error(`Failed to process ${url.url}: ${result.error}`);
      }
      
      if (refetch) {
        await refetch();
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
          onSubmit={handleAddWebsiteUrl}
          isSubmitting={addWebsiteUrl.isPending}
        />
        
        <WebsiteUrlsList
          urls={websiteUrls}
          onDelete={handleDeleteWebsiteUrl}
          onProcess={handleProcessWebsite}
          isDeleteLoading={deleteWebsiteUrl.isPending}
          isProcessing={isProcessing}
          deletingId={deleteWebsiteUrl.variables as number | undefined}
        />
      </CardContent>
    </Card>
  );
};

export default WebsiteResourcesSection;
