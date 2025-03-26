
import React from 'react';
import { WebsiteUrl } from '@/types/website-url';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { ActivityType } from '@/types/client-form';

interface ClientResourceSectionsProps {
  clientId: string;
  websiteUrls?: WebsiteUrl[];
  isProcessing?: boolean;
  isDeleting?: boolean;
  refetchWebsiteUrls?: () => void;
  onResourceChange?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  websiteUrls = [],
  isProcessing = false,
  isDeleting = false,
  refetchWebsiteUrls,
  onResourceChange,
  logClientActivity
}: ClientResourceSectionsProps) => {
  return (
    <div className="space-y-8">
      <WebsiteResourcesSection 
        clientId={clientId}
        urls={websiteUrls.map(url => ({
          ...url,
          refresh_rate: url.refresh_rate || 30,
          status: (url.status as "pending" | "processing" | "failed" | "completed") || "pending"
        }))}
        isProcessing={isProcessing}
        isDeleting={isDeleting}
        refetchUrls={refetchWebsiteUrls}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <DocumentResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};
