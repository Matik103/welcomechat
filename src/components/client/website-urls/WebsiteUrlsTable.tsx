
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { WebsiteUrl } from '@/types/website-url';
import { truncateString, formatDate } from '@/utils/stringUtils';

interface WebsiteUrlsTableProps {
  urls: WebsiteUrl[];
  onDelete: (urlId: number) => Promise<void>;
  isDeleting: boolean;
}

export const WebsiteUrlsTable: React.FC<WebsiteUrlsTableProps> = ({
  urls,
  onDelete,
  isDeleting
}) => {
  const getStatusBadgeColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      case 'processing':
        return "bg-blue-100 text-blue-800";
      case 'pending':
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          <TableHead>Added</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {urls.map((url) => (
          <TableRow key={url.id}>
            <TableCell>
              <a
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {truncateString(url.url, 50)}
              </a>
            </TableCell>
            <TableCell>{formatDate(url.created_at)}</TableCell>
            <TableCell>
              {url.status && (
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(url.status)}`}>
                  {url.status.charAt(0).toUpperCase() + url.status.slice(1)}
                </span>
              )}
              {url.scrapability && (
                <span className="ml-2 text-xs text-gray-500">
                  {url.scrapability === 'high' ? '(High scrapability)' : 
                    url.scrapability === 'medium' ? '(Medium scrapability)' : 
                      url.scrapability === 'low' ? '(Low scrapability)' : ''}
                </span>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(url.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
