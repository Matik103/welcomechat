
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrlsList } from '@/components/client/website-urls/WebsiteUrlsList';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { WebsiteUrl } from '@/types/website-url';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';

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
  const [processingUrlId, setProcessingUrlId] = useState<number | null>(null);
  const [deletingUrlId, setDeletingUrlId] = useState<number | null>(null);
  
  const {
    addWebsite,
    deleteWebsite,
    storeWebsiteContent,
    isStoring
  } = useStoreWebsiteContent(clientId);

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      setAddingUrl(true);
      
      // Add the website to the database
      const result = await addWebsite({
        client_id: clientId,
        url: data.url,
        refresh_rate: data.refresh_rate,
        scrapable: true
      });
      
      if (result && result.length > 0) {
        const website = {
          ...result[0],
          scrapable: true, // Add scrapable property since it's required
          name: `Website ${result[0].id}` // Add name property for compatibility
        };
        
        // Store the website content
        await storeWebsiteContent(website, clientId);
        
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
      setDeletingUrlId(urlId);
      const urlToDelete = urls.find(u => u.id === urlId);
      
      await deleteWebsite(urlId);
      
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
    } finally {
      setDeletingUrlId(null);
    }
  };

  const handleProcessWebsiteUrl = async (url: WebsiteUrl) => {
    try {
      setProcessingUrlId(url.id);
      
      // Process the website content
      const urlWithScrapable = {
        ...url,
        scrapable: true, // Add scrapable property
        name: `Website ${url.id}` // Add name property for compatibility
      };
      
      // Store the website content
      await storeWebsiteContent(urlWithScrapable, clientId);
      
      // Log activity
      await logClientActivity(
        'document_processing_started',
        `Started processing website: ${url.url}`,
        { url: url.url }
      );
      
      toast.success('Website processing started');
      
      if (refetchUrls) {
        refetchUrls();
      }
    } catch (error) {
      console.error('Error processing website URL:', error);
      toast.error('Failed to process website');
    } finally {
      setProcessingUrlId(null);
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
          isAdding={addingUrl || isStoring}
          agentName="AI Agent"
        />
        
        <WebsiteUrlsList 
          urls={urls}
          onDelete={handleDeleteWebsiteUrl}
          onProcess={handleProcessWebsiteUrl}
          isDeleteLoading={isDeleting}
          isProcessing={isProcessing || isStoring || !!processingUrlId}
          deletingId={deletingUrlId}
        />
      </CardContent>
    </Card>
  );
};

export default WebsiteResourcesSection;
