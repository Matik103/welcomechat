
import React from 'react';
import { DocumentLink } from '@/types/document-processing';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (id: number) => void;
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
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        No document links have been added yet.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-1 truncate text-sm">
            <a
              href={link.link}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {link.link}
            </a>
          </span>
          <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(link.id)}
            disabled={isDeleting || deletingId === link.id}
            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            {(isDeleting && deletingId === link.id) ? (
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
