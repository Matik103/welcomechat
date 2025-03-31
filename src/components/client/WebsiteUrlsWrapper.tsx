
import React from 'react';
import { WebsiteUrls } from './website-urls';
import { useAuth } from '@/contexts/AuthContext';

interface WebsiteUrlsWrapperProps {
  onResourceChange?: () => void;
  logClientActivity?: () => Promise<void>;
}

export function WebsiteUrlsWrapper({ onResourceChange, logClientActivity }: WebsiteUrlsWrapperProps) {
  // Get the client's ID from auth context
  const { user } = useAuth();
  const clientId = user?.id || '';

  if (!clientId) {
    return <div>Loading...</div>;
  }

  return (
    <WebsiteUrls 
      clientId={clientId} 
      onResourceChange={onResourceChange}
      logClientActivity={logClientActivity}
    />
  );
}
