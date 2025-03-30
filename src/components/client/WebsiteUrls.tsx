
import React from 'react';
import { Card } from '@/components/ui/card';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';
import { WebsiteUrlForm } from './website-urls/WebsiteUrlForm';
import { WebsiteUrlsList } from './website-urls/WebsiteUrlsList';
import WebsiteUrlsLoading from './website-urls/WebsiteUrlsLoading';
import WebsiteUrlsListEmpty from './website-urls/WebsiteUrlsListEmpty';
import { ActivityType, ActivityTypeString } from '@/types/activity';

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: WebsiteUrlFormData) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  deletingId?: number;
  agentName: string;
  isClientView?: boolean;
  deletingUrlId?: number;
  clientId?: string;
  onResourceChange?: () => void;
  logClientActivity: (type: ActivityType | ActivityTypeString, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const WebsiteUrls: React.FC<WebsiteUrlsProps> = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  deletingId,
  agentName,
  isClientView = false,
  deletingUrlId,
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const handleDelete = async (urlId: number) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      await onDelete(urlId);
      await logClientActivity(ActivityType.URL_REMOVED, 'Removed website URL');
    }
  };

  const handleAdd = async (data: WebsiteUrlFormData) => {
    await onAdd(data);
    await logClientActivity(ActivityType.URL_ADDED, 'Added website URL', { url: data.url });
  };

  return (
    <div className="space-y-6">
      <WebsiteUrlForm 
        onSubmit={handleAdd} 
        onAdd={handleAdd}
        isSubmitting={isAdding}
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
          <WebsiteUrlsList 
            urls={urls} 
            onDelete={handleDelete} 
            isDeleting={isDeleting}
            deletingId={deletingId || deletingUrlId}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteUrls;
