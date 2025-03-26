
import React from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { WebsiteUrl } from '@/types/client';
import { ActivityType } from '@/types/client-form';

interface ClientResourceSectionsProps {
  clientId: string;
  websiteUrls?: WebsiteUrl[];
  isProcessing?: boolean;
  isDeleting?: boolean;
  refetchWebsiteUrls?: () => void;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientResourceSections: React.FC<ClientResourceSectionsProps> = ({
  clientId,
  websiteUrls,
  isProcessing,
  isDeleting,
  refetchWebsiteUrls,
  logClientActivity
}) => {
  const handleResourceChange = () => {
    if (refetchWebsiteUrls) {
      refetchWebsiteUrls();
    }
  };

  return (
    <div className="space-y-6">
      <WebsiteResourcesSection
        clientId={clientId}
        websiteUrls={websiteUrls}
        onResourceChange={handleResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <DocumentResourcesSection
        clientId={clientId}
        onResourceChange={handleResourceChange}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};

export default ClientResourceSections;
