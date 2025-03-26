
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { DocumentLink } from '@/types/document-processing';
import { formatDistanceToNow } from 'date-fns';

interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (id: number) => Promise<void>;
  isLoading: boolean;
  isDeleting: boolean;
  deletingId?: number | null;
}

export const DocumentLinksList: React.FC<DocumentLinksListProps> = ({
  links,
  onDelete,
  isLoading,
  isDeleting,
  deletingId
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/50">
        <h3 className="font-medium mb-2">No Drive Links Added</h3>
        <p className="text-muted-foreground">
          Add Google Drive links to provide your AI agent with content.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md divide-y">
      {links.map((link) => (
        <div key={link.id} className="p-4 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h4 className="font-medium truncate">{link.link}</h4>
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              <span>Added {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
              <span>Refreshes every {link.refresh_rate} hours</span>
              <span>Status: {link.status || 'Pending'}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onDelete(link.id)}
            disabled={isDeleting && deletingId === link.id}
          >
            {isDeleting && deletingId === link.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
