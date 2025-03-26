
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebsiteUrlForm } from '../website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from '../website-urls/WebsiteUrlsList'; 
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';
import { ActivityType, WebsiteUrlFormData } from '@/types/client-form';
import { WebsiteUrl } from '@/types/website-url';
import { Website } from '@/types/website-url';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WebsiteResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export function WebsiteResourcesSection({ 
  clientId,
  onResourceChange,
  logClientActivity
}: WebsiteResourcesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isWebsiteToProcess, setIsWebsiteToProcess] = useState<WebsiteUrl | null>(null);
  
  // Get website URLs data and mutations
  const { 
    websiteUrls,
    refetchWebsiteUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    isLoading, 
    isError
  } = useWebsiteUrls(clientId);
  
  // Get content storage mutation
  const storeContentMutation = useStoreWebsiteContent(clientId);
  
  // Handle submitting new website URL
  const handleSubmit = async (data: WebsiteUrlFormData): Promise<void> => {
    try {
      await addWebsiteUrlMutation.mutateAsync({
        clientId,
        url: data.url,
        refresh_rate: data.refresh_rate
      });
      
      // Log activity
      await logClientActivity(
        'url_added',
        `Added website URL: ${data.url}`,
        { url: data.url, refresh_rate: data.refresh_rate }
      );
      
      // Hide the form after successful submission
      setShowForm(false);
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
      
      // Refetch to get the latest data
      refetchWebsiteUrls();
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error('Failed to add website URL');
    }
  };
  
  // Handle deleting a website URL
  const handleDelete = async (urlId: number) => {
    try {
      // Find the URL being deleted to include in the log
      const urlToDelete = websiteUrls.find(url => url.id === urlId);
      
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      
      // Log activity
      if (urlToDelete) {
        await logClientActivity(
          'url_removed',
          `Removed website URL: ${urlToDelete.url}`,
          { url: urlToDelete.url, url_id: urlId }
        );
      }
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };
  
  // Handle processing website content
  const handleProcessWebsite = async (website: WebsiteUrl) => {
    try {
      setIsStoring(true);
      setIsWebsiteToProcess(website);
      
      // Create a Website object compatible with storeWebsiteContent
      const websiteToProcess: Website = {
        id: website.id,
        url: website.url,
        refresh_rate: website.refresh_rate,
        client_id: website.client_id,
        created_at: website.created_at,
        status: website.status
      };
      
      // Store the website content
      const result = await storeContentMutation.mutateAsync(websiteToProcess);
      
      // Log activity based on the result
      if (result.success) {
        await logClientActivity(
          'url_processed',
          `Processed website: ${website.url}`,
          { 
            url: website.url, 
            url_id: website.id
          }
        );
        
        toast.success(`Website processed successfully`);
      } else {
        await logClientActivity(
          'url_processing_failed',
          `Failed to process website: ${website.url}`,
          { 
            url: website.url, 
            url_id: website.id,
            error: result.error
          }
        );
        
        toast.error(`Failed to process website: ${result.error}`);
      }
      
      // Refetch to get updated status
      refetchWebsiteUrls();
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error processing website:', error);
      toast.error('Failed to process website');
      
      // Log the error
      await logClientActivity(
        'url_processing_failed',
        `Failed to process website: ${website.url}`,
        { 
          url: website.url, 
          url_id: website.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
    } finally {
      setIsStoring(false);
      setIsWebsiteToProcess(null);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Website Resources</CardTitle>
        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "default"}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Add Website"}
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6">
            <WebsiteUrlForm 
              onSubmit={handleSubmit}
              isSubmitting={addWebsiteUrlMutation.isPending}
            />
          </div>
        )}
        
        <WebsiteUrlsList 
          urls={websiteUrls}
          onDelete={handleDelete}
          onProcess={handleProcessWebsite}
          isLoading={isLoading}
          isProcessing={isStoring}
          processingId={isWebsiteToProcess?.id}
          isDeleting={deleteWebsiteUrlMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
