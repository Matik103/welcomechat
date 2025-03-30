
import React, { useEffect } from 'react';
import WebsiteUrlsLoading from './WebsiteUrlsLoading';
import WebsiteUrlsListEmpty from './WebsiteUrlsListEmpty';
import { WebsiteUrlsTable } from './WebsiteUrlsTable';
import { useWebsiteUrlsFetch } from '@/hooks/website-urls/useWebsiteUrlsFetch';
import { useWebsiteUrlsMutation } from '@/hooks/website-urls/useWebsiteUrlsMutation';

export interface WebsiteUrlsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity?: () => Promise<void>;
}

export function WebsiteUrls({ clientId, onResourceChange, logClientActivity }: WebsiteUrlsProps) {
  const { 
    websiteUrls, 
    isLoading, 
    refetchWebsiteUrls 
  } = useWebsiteUrlsFetch(clientId);

  const { 
    deleteWebsiteUrl, 
    deleteWebsiteUrlMutation 
  } = useWebsiteUrlsMutation(clientId);

  useEffect(() => {
    // Initial fetch
    refetchWebsiteUrls();
  }, [refetchWebsiteUrls, clientId]);

  const handleDelete = async (websiteUrlId: number) => {
    try {
      await deleteWebsiteUrl(websiteUrlId);
      
      // Log client activity
      if (logClientActivity) {
        await logClientActivity();
      }
      
      // Trigger refetch after delete
      refetchWebsiteUrls();
      
      // Notify parent component if needed
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error("Error deleting website URL:", error);
    }
  };

  if (isLoading) {
    return <WebsiteUrlsLoading />;
  }

  if (!websiteUrls || websiteUrls.length === 0) {
    return <WebsiteUrlsListEmpty />;
  }

  return (
    <WebsiteUrlsTable 
      urls={websiteUrls} 
      onDelete={handleDelete} 
      isDeleting={deleteWebsiteUrlMutation.isPending}
    />
  );
}
