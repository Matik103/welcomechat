
import React from 'react';
import { DocumentLinkForm } from './DocumentLinkForm';
import { DocumentLinksList } from './DocumentLinksList';
import { DocumentLink } from '@/types/document-processing';

interface DriveLinksProps {
  links: DocumentLink[];
  isLoading: boolean;
  addDocumentLink: (data: { link: string; refresh_rate: number; }) => Promise<void>;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  isAddingLink: boolean;
  isDeletingLink: boolean;
}

const DriveLinks: React.FC<DriveLinksProps> = ({
  links,
  isLoading,
  addDocumentLink,
  deleteDocumentLink,
  isAddingLink,
  isDeletingLink
}) => {
  const handleAddLink = async (data: { link: string; refresh_rate: number; }) => {
    await addDocumentLink(data);
  };

  const handleDeleteLink = async (linkId: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      await deleteDocumentLink(linkId);
    }
  };

  return (
    <div className="space-y-6">
      <DocumentLinkForm 
        onSubmit={handleAddLink} 
        isSubmitting={isAddingLink} 
      />

      <div>
        <h3 className="font-medium mb-2">Google Drive Links</h3>
        <DocumentLinksList 
          links={links} 
          onDelete={handleDeleteLink} 
          isLoading={isLoading}
          isDeleting={isDeletingLink}
        />
      </div>
    </div>
  );
};

export default DriveLinks;
