
import React from 'react';
import { Card } from '@/components/ui/card';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';
import { WebsiteUrlForm } from './website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from './website-urls/WebsiteUrlsList';
import WebsiteUrlsLoading from './website-urls/WebsiteUrlsLoading';
import WebsiteUrlsListEmpty from './website-urls/WebsiteUrlsListEmpty';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: WebsiteUrlFormData) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  deletingId?: number;
  agentName: string;
  isClientView?: boolean;
  deletingUrlId?: number;
}

export const WebsiteUrls: React.FC<WebsiteUrlsProps> = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  deletingId,
  agentName,
  isClientView = false,
  deletingUrlId
}) => {
  const { user } = useAuth();
  
  // Debug user metadata
  React.useEffect(() => {
    console.log("WebsiteUrls Component - User metadata:", user?.user_metadata);
    console.log("WebsiteUrls Component - URLs:", urls);
  }, [user, urls]);

  const handleDelete = async (urlId: number) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      try {
        await onDelete(urlId);
      } catch (error) {
        console.error("Error deleting URL:", error);
        toast.error("Failed to delete URL. Please try again.");
      }
    }
  };

  const handleAdd = async (data: WebsiteUrlFormData) => {
    try {
      console.log("WebsiteUrls Component - Adding URL with data:", data);
      await onAdd(data);
    } catch (error) {
      console.error("Error adding URL:", error);
    }
  };

  return (
    <div className="space-y-6">
      <WebsiteUrlForm 
        onSubmit={handleAdd} 
        onAdd={handleAdd}
        isSubmitting={isAdding}
        isAdding={isAdding}
        agentName={agentName} 
      />
      
      <div>
        <h3 className="font-medium mb-2">Website URLs</h3>
        {isLoading ? (
          <WebsiteUrlsLoading />
        ) : urls.length === 0 ? (
          <WebsiteUrlsListEmpty />
        ) : (
          <WebsiteUrlsList 
            urls={urls} 
            onDelete={handleDelete} 
            isDeleting={isDeleting}
            deletingId={deletingId || deletingUrlId}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteUrls;
