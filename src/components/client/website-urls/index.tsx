
import React from 'react';
import { WebsiteUrlForm } from './WebsiteUrlForm';
import { WebsiteUrlsList } from './WebsiteUrlsList';
import { WebsiteUrl } from '@/types/website-url';

export interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  deletingUrlId: number;
  agentName: string;
}

export const WebsiteUrls: React.FC<WebsiteUrlsProps> = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  deletingUrlId,
  agentName
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Website URLs</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add website URLs to be processed for your AI agent. The content will be indexed and made available to your agent.
        </p>
        
        <WebsiteUrlForm 
          onSubmit={onAdd} 
          isSubmitting={isAdding}
          agentName={agentName} 
        />
      </div>
      
      <WebsiteUrlsList
        urls={urls}
        onDelete={onDelete}
        isDeleting={isDeleting}
        deletingId={deletingUrlId}
      />
    </div>
  );
};

export default WebsiteUrls;
