
import React from 'react';
import { DocumentLink } from '@/types/document-processing';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
  isDeleting?: boolean;
  deletingId?: number | null;
}

export const DocumentLinksList: React.FC<DocumentLinksListProps> = ({
  links,
  onDelete,
  isLoading = false,
  isDeleting = false,
  deletingId = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (links.length === 0) {
    return <div className="text-sm text-gray-500 italic">No document links added yet.</div>;
  }

  const getStatusBadgeColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return "bg-green-100 text-green-800";
      case 'pending':
      case 'processing':
        return "bg-blue-100 text-blue-800";
      case 'failed':
      case 'error':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm">{link.link}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{link.document_type || 'document'}</span>
              <span className="text-xs text-gray-500">({link.refresh_rate} days)</span>
              
              {link.access_status && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusBadgeColor(link.access_status)}`}
                >
                  {link.access_status}
                </Badge>
              )}
              
              {link.status && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusBadgeColor(link.status)}`}
                >
                  {link.status}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(link.id)}
            disabled={isDeleting && deletingId === link.id}
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
