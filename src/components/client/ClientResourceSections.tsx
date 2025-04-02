
import React from 'react';
import { DocumentResourcesSection } from '../client/resource-sections/DocumentResourcesSection';
import { WebsiteResourcesSection } from '../client/resource-sections/WebsiteResourcesSection';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { DocumentUploadSection } from './resource-sections/DocumentUploadSection';

interface ClientResourceSectionsProps {
  clientId: string;
  logClientActivity: () => Promise<void>;
  onResourceChange?: () => void;
}

export const ClientResourceSections: React.FC<ClientResourceSectionsProps> = ({
  clientId,
  logClientActivity,
  onResourceChange
}) => {
  console.log("ClientResourceSections rendering with clientId:", clientId);
  
  if (!clientId) {
    console.error("ClientResourceSections: No clientId provided");
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">Error: Client ID is required to display resources.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DocumentUploadSection 
        clientId={clientId} 
        logClientActivity={logClientActivity}
        onUploadComplete={onResourceChange}
      />
      
      <DocumentResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <WebsiteResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};
