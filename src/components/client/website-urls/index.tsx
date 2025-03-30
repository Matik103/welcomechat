
import React, { useEffect, useState } from 'react';
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
  const [initializing, setInitializing] = useState(true);
  
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
    // Debug info
    console.log("WebsiteUrls index component rendered with clientId:", clientId);
    console.log("Website URLs:", websiteUrls);
    
    // Initial fetch
    refetchWebsiteUrls();
    
    // Set initializing to false after a short delay
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [refetchWebsiteUrls, clientId, websiteUrls]);

  const handleDelete = async (websiteUrlId: number) => {
    try {
      console.log("Deleting website URL with ID:", websiteUrlId);
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

  if (initializing || isLoading) {
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
