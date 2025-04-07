import React from 'react';
import { DocumentLink } from '@/types/document-processing';
import { Button } from '@/components/ui/button';
import { Trash, Loader2, ExternalLink, FileText, Sheet, SheetIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  deletingId = null
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading document links...</span>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="font-medium">No documents added</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add Google Drive links or upload documents to provide information for your AI agent.
        </p>
      </div>
    );
  }

  const renderLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'google_drive':
        return <SheetIcon className="h-4 w-4 mr-1" />;
      case 'google_sheet':
        return <Sheet className="h-4 w-4 mr-1" />;
      default:
        return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  const getStatusBadge = (link: DocumentLink) => {
    const accessStatus = link.access_status || 'unknown';
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'granted': { color: 'bg-green-100 text-green-800', label: 'Granted' },
      'denied': { color: 'bg-red-100 text-red-800', label: 'Access Denied' },
      'unknown': { color: 'bg-gray-100 text-gray-800', label: 'Checking Access' },
      'processed': { color: 'bg-green-100 text-green-800', label: 'Processed' },
      'processing': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };

    const status = statusMap[accessStatus] || statusMap.unknown;
    
    return (
      <Badge variant="outline" className={`${status.color} text-xs`}>
        {status.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="flex items-center max-w-[70%]">
            {renderLinkTypeIcon(link.document_type)}
            <a
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
            >
              {link.link}
            </a>
            <ExternalLink className="h-3 w-3 ml-1 inline-flex" />
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(link)}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(link.id)}
                    disabled={isDeleting && deletingId === link.id}
                    className="h-7 w-7"
                  >
                    {isDeleting && deletingId === link.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete document link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ))}
    </div>
  );
};
