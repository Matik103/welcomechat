
import React from 'react';
import { WebsiteUrlForm } from './WebsiteUrlForm';
import { WebsiteUrlsList } from './WebsiteUrlsList';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';

export interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: WebsiteUrlFormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  deletingId?: number;
  agentName: string;
  deletingUrlId?: number;
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
  deletingUrlId
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
          onAdd={onAdd}
          isSubmitting={isAdding}
          isAdding={isAdding}
          agentName={agentName} 
        />
      </div>
      
      <WebsiteUrlsList
        urls={urls}
        onDelete={onDelete}
        isDeleting={isDeleting}
        deletingId={deletingId || deletingUrlId}
      />
    </div>
  );
};

export default WebsiteUrls;
