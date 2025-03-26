
import React from 'react';
import { Card } from '@/components/ui/card';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';
import { WebsiteUrlForm } from './website-urls/WebsiteUrlForm';
import { WebsiteUrlsTable } from './website-urls/WebsiteUrlsTable';
import WebsiteUrlsLoading from './website-urls/WebsiteUrlsLoading';
import WebsiteUrlsListEmpty from './website-urls/WebsiteUrlsListEmpty';

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: WebsiteUrlFormData) => Promise<boolean>;
  onDelete: (urlId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
  isClientView?: boolean;
}

export const WebsiteUrls: React.FC<WebsiteUrlsProps> = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  agentName,
  isClientView = false
}) => {
  const handleDelete = async (urlId: number) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      await onDelete(urlId);
    }
  };

  return (
    <div className="space-y-6">
      <WebsiteUrlForm 
        onAdd={onAdd} 
        isAdding={isAdding}
        agentName={agentName}
      />

      <div>
        <h3 className="font-medium mb-2">Website URLs</h3>
        {isLoading ? (
          <WebsiteUrlsLoading />
        ) : urls.length === 0 ? (
          <WebsiteUrlsListEmpty />
        ) : (
          <WebsiteUrlsTable 
            urls={urls} 
            onDelete={handleDelete} 
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
};
