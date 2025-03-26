
import React, { useState } from 'react';
import DocumentLinkForm from './DocumentLinkForm';
import DocumentLinksList from './DocumentLinksList';
import { DocumentLink } from '@/types/client';

export interface DriveLinksProps {
  links: DocumentLink[];
  isLoading?: boolean;
  isUploading?: boolean;
  addDocumentLink: (data: { link: string; refresh_rate: number; }) => Promise<void>;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  validateLink?: (url: string) => Promise<boolean>;
  validateError?: string | null;
  isValidating?: boolean;
  isDeleteLoading?: boolean;
}

const DriveLinks: React.FC<DriveLinksProps> = ({
  links = [],
  isLoading = false,
  isUploading = false,
  addDocumentLink,
  deleteDocumentLink,
  validateLink,
  validateError,
  isValidating = false,
  isDeleteLoading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { link: string; refresh_rate: number }) => {
    setIsSubmitting(true);
    try {
      await addDocumentLink(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Google Drive Documents</h3>
      
      <DocumentLinkForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting || isUploading}
        validateLink={validateLink}
        validateError={validateError}
        isValidating={isValidating}
      />
      
      <DocumentLinksList 
        links={links} 
        onDelete={deleteDocumentLink}
        isLoading={isLoading}
        isDeleteLoading={isDeleteLoading}
      />
    </div>
  );
};

export default DriveLinks;
