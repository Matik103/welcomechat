
import React from 'react';
import { WebsiteUrl } from '@/types/website-url';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';

interface WebsiteUrlsListProps {
  urls: WebsiteUrl[];
  onDelete: (id: number) => Promise<void>;
  isDeleting: boolean;
  deletingId?: number | null;
}

export const WebsiteUrlsList: React.FC<WebsiteUrlsListProps> = ({
  urls,
  onDelete,
  isDeleting,
  deletingId,
}) => {
  if (urls.length === 0) {
    return <div className="text-sm text-gray-500 italic">No website URLs added yet.</div>;
  }

  return (
    <div className="space-y-2">
      {urls.map((url) => (
        <div key={url.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-1 truncate text-sm">{url.url}</span>
          <span className="text-sm text-gray-500 whitespace-nowrap">({url.refresh_rate} days)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(url.id)}
            disabled={isDeleting || deletingId === url.id}
            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            {(isDeleting && deletingId === url.id) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
