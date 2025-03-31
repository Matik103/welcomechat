
import React, { useEffect, useState, useCallback, memo } from 'react';
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

// Use memo to prevent unnecessary re-renders
export const WebsiteUrls = memo(function WebsiteUrls({ 
  clientId, 
  onResourceChange, 
  logClientActivity 
}: WebsiteUrlsProps) {
  const [initializing, setInitializing] = useState(true);
  const [refetchCounter, setRefetchCounter] = useState(0);
  
  const { 
    websiteUrls, 
    isLoading, 
    refetchWebsiteUrls 
  } = useWebsiteUrlsFetch(clientId);

  const { 
    deleteWebsiteUrl, 
    deleteWebsiteUrlMutation 
  } = useWebsiteUrlsMutation(clientId);

  // Only fetch data when clientId changes or refetchCounter changes
  useEffect(() => {
    if (clientId) {
      refetchWebsiteUrls();
    }
    
    // Set initializing to false after a short delay
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clientId, refetchWebsiteUrls, refetchCounter]);

  // Memoize the delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback(async (websiteUrlId: number) => {
    try {
      console.log("Deleting website URL with ID:", websiteUrlId);
      await deleteWebsiteUrl(websiteUrlId);
      
      // Log client activity
      if (logClientActivity) {
        await logClientActivity();
      }
      
      // Use counter to trigger refetch
      setRefetchCounter(prev => prev + 1);
      
      // Notify parent component if needed
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error("Error deleting website URL:", error);
    }
  }, [deleteWebsiteUrl, logClientActivity, onResourceChange]);

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
});
