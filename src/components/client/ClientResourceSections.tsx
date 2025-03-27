
import React from 'react';
import { WebsiteUrl } from '@/types/website-url';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';

interface ClientResourceSectionsProps {
  clientId: string;
  websiteUrls?: WebsiteUrl[];
  isProcessing?: boolean;
  isDeleting?: boolean;
  refetchWebsiteUrls?: () => void;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  onResourceChange,
  logClientActivity
}: ClientResourceSectionsProps) => {
  return (
    <div className="space-y-8">
      <WebsiteResourcesSection 
        clientId={clientId}
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

export default ClientResourceSections;
