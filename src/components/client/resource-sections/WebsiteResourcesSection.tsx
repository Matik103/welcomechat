
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebsiteUrlForm } from '../website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from '../website-urls/WebsiteUrlsList'; 
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WebsiteResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
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
        url: data.url,
        refresh_rate: data.refresh_rate
      });
      
      // Log activity
      await logClientActivity();
      
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
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      
      // Log activity
      await logClientActivity();
      
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
      
      // Store the website content
      const result = await storeContentMutation.mutateAsync(website);
      
      // Log activity based on the result
      if (result.success) {
        await logClientActivity();
        toast.success(`Website processed successfully`);
      } else {
        await logClientActivity();
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
      await logClientActivity();
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
              onAdd={handleSubmit}
              isSubmitting={addWebsiteUrlMutation.isPending}
              isAdding={addWebsiteUrlMutation.isPending}
              agentName="AI Assistant"
            />
          </div>
        )}
        
        <WebsiteUrlsList 
          urls={websiteUrls}
          onDelete={handleDelete}
          onProcess={handleProcessWebsite}
          isDeleting={false}
          isProcessing={isStoring}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
          deletingId={isWebsiteToProcess?.id}
        />
      </CardContent>
    </Card>
  );
}
