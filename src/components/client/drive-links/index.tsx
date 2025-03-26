
import React from 'react';
import { DocumentLinkForm } from './DocumentLinkForm';
import { DocumentLinksList } from './DocumentLinksList';
import { DocumentLink, DocumentLinkFormData } from '@/types/document-processing';

export interface DriveLinksProps {
  links: DocumentLink[];
  isLoading: boolean;
  addDocumentLink: (data: { link: string; refresh_rate: number; document_type: string }) => Promise<void>;
  deleteDocumentLink: (id: number) => Promise<void>;
  isAddingLink: boolean;
  isDeletingLink: boolean;
  deletingLinkId?: number | null;
  agentName?: string;
}

const DriveLinks: React.FC<DriveLinksProps> = ({
  links,
  isLoading,
  addDocumentLink,
  deleteDocumentLink,
  isAddingLink,
  isDeletingLink,
  deletingLinkId,
  agentName = "AI Assistant"
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Google Drive Links</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add Google Drive documents to be processed for your AI agent. The documents will be refreshed periodically.
        </p>
        
        <DocumentLinkForm
          onSubmit={async (data: DocumentLinkFormData) => {
            await addDocumentLink({
              link: data.link,
              refresh_rate: data.refresh_rate,
              document_type: 'google_drive'
            });
          }}
          isSubmitting={isAddingLink}
          agentName={agentName}
        />
      </div>
      
      <DocumentLinksList
        links={links}
        onDelete={deleteDocumentLink}
        isLoading={isLoading}
        isDeleting={isDeletingLink}
        deletingId={deletingLinkId}
      />
    </div>
  );
};

export default DriveLinks;
