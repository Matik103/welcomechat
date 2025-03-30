
import React from 'react';
import { WebsiteUrlFormData } from '@/types/website-url';
import { WebsiteUrlsList } from './website-urls/WebsiteUrlsList';
import WebsiteUrlsLoading from './website-urls/WebsiteUrlsLoading';
import WebsiteUrlsListEmpty from './website-urls/WebsiteUrlsListEmpty';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useWebsiteUrlsMutation } from '@/hooks/website-urls/useWebsiteUrlsMutation';

interface WebsiteUrlsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
}

export const WebsiteUrls: React.FC<WebsiteUrlsProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const { user } = useAuth();
  const { websiteUrls, isLoading: isLoadingUrls, refetchWebsiteUrls } = useWebsiteUrls(clientId);
  const { 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation 
  } = useWebsiteUrlsMutation(clientId);
  
  // Debug user metadata
  React.useEffect(() => {
    console.log("WebsiteUrls Component - User metadata:", user?.user_metadata);
    console.log("WebsiteUrls Component - Client ID:", clientId);
    console.log("WebsiteUrls Component - URLs:", websiteUrls);
  }, [user, websiteUrls, clientId]);

  const handleDelete = async (urlId: number) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      try {
        await deleteWebsiteUrlMutation.mutateAsync(urlId);
        
        // Refetch the list of URLs
        refetchWebsiteUrls();
        
        if (onResourceChange) {
          onResourceChange();
        }
        
        await logClientActivity();
        
        toast.success("URL deleted successfully");
      } catch (error) {
        console.error("Error deleting URL:", error);
        toast.error("Failed to delete URL. Please try again.");
      }
    }
  };

  const handleAdd = async (data: WebsiteUrlFormData) => {
    try {
      console.log("WebsiteUrls Component - Adding URL with data:", data);
      console.log("WebsiteUrls Component - Client ID:", clientId);
      
      await addWebsiteUrlMutation.mutateAsync({
        ...data,
        client_id: clientId
      });
      
      // Refetch the list of URLs
      refetchWebsiteUrls();
      
      if (onResourceChange) {
        onResourceChange();
      }
      
      await logClientActivity();
      
      toast.success("URL added successfully");
    } catch (error) {
      console.error("Error adding URL:", error);
      toast.error(`Failed to add URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Website URLs</h3>
        {isLoadingUrls ? (
          <WebsiteUrlsLoading />
        ) : websiteUrls.length === 0 ? (
          <WebsiteUrlsListEmpty />
        ) : (
          <WebsiteUrlsList 
            urls={websiteUrls} 
            onDelete={handleDelete} 
            isDeleting={deleteWebsiteUrlMutation.isPending}
            deletingId={deleteWebsiteUrlMutation.variables}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteUrls;
