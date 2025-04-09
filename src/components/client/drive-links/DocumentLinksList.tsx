
import React from 'react';
import { DocumentLink } from '@/types/document-processing';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
  isDeleting?: boolean;
  deletingId?: number | null;
}

export function DocumentLinksList({
  links,
  onDelete,
  isLoading = false,
  isDeleting = false,
  deletingId
}: DocumentLinksListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-muted-foreground mt-2">Loading document links...</p>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-4 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">No document links added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div 
          key={link.id}
          className="border rounded-md p-3 flex items-center justify-between bg-white"
        >
          <div className="flex-grow">
            <div className="flex items-center">
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-700 hover:underline flex items-center"
              >
                {link.link.length > 50 ? `${link.link.substring(0, 50)}...` : link.link}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Added {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
              {' · '}
              Refresh: Every {link.refresh_rate} days
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(link.id)}
            disabled={isDeleting && deletingId === link.id}
          >
            {isDeleting && deletingId === link.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
