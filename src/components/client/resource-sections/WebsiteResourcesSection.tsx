
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [processingWebsiteId, setProcessingWebsiteId] = useState<number | null>(null);
  
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
      
      toast.success('Website URL added successfully');
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
      
      toast.success('Website URL deleted successfully');
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error('Failed to delete website URL');
    }
  };
  
  // Handle processing website content
  const handleProcessWebsite = async (website: WebsiteUrl) => {
    try {
      setIsStoring(true);
      setProcessingWebsiteId(website.id);
      
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
      setProcessingWebsiteId(null);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Website Resources</CardTitle>
          <CardDescription>Add and manage website URLs for your AI agent</CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          className={!showForm ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
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
              clientId={clientId}
            />
          </div>
        )}
        
        <WebsiteUrlsList 
          urls={websiteUrls}
          onDelete={handleDelete}
          onProcess={handleProcessWebsite}
          isDeleting={deleteWebsiteUrlMutation.isPending}
          isProcessing={isStoring}
          deletingId={processingWebsiteId}
        />
      </CardContent>
    </Card>
  );
}
