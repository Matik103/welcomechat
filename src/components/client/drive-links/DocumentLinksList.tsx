
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentLink } from '@/types/client';

export interface DocumentLinksListProps {
  links: DocumentLink[];
  isLoading: boolean;
  onDelete: (id: number) => Promise<void>;
  isDeleting?: boolean;
}

export const DocumentLinksList: React.FC<DocumentLinksListProps> = ({
  links,
  isLoading,
  onDelete,
  isDeleting = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded border border-gray-100">
        <p className="text-gray-500 text-sm">No document links added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Added Document Links</h3>
      <div className="border rounded-md divide-y">
        {links.map((link) => (
          <div key={link.id} className="p-3 flex justify-between items-center">
            <div className="space-y-1 overflow-hidden">
              <div className="font-medium text-sm truncate max-w-lg" title={link.link}>
                {link.link}
              </div>
              <div className="text-xs text-gray-500 flex space-x-3">
                <span>
                  Added: {format(new Date(link.created_at), 'MMM d, yyyy')}
                </span>
                <span>
                  Refresh: Every {link.refresh_rate} days
                </span>
                <span>
                  Status: {link.access_status || 'unknown'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(link.id)}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentLinksList;
