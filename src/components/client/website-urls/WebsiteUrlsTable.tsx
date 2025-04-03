
import React from 'react';
import { WebsiteUrl, WebsiteUrlsListProps } from '@/types/website-url';
import { Button } from '@/components/ui/button';
import { Trash, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

export function WebsiteUrlsTable({ 
  urls, 
  onDelete, 
  isDeleting = false,
  deletingId = null 
}: WebsiteUrlsListProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };
  
  const getStatusIcon = (status: string | undefined) => {
    switch(status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Crawled</TableHead>
            <TableHead>Refresh Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urls.map((url) => (
            <TableRow key={url.id}>
              <TableCell className="max-w-xs truncate font-medium">
                <a 
                  href={url.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600"
                >
                  {url.url}
                </a>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(url.status)}
                  <span className="capitalize">{url.status || 'Pending'}</span>
                </div>
                {url.error && (
                  <div className="text-xs text-red-500 mt-1 truncate max-w-[200px]" title={url.error}>
                    {url.error}
                  </div>
                )}
              </TableCell>
              <TableCell>{formatDate(url.last_crawled)}</TableCell>
              <TableCell>{url.refresh_rate} days</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(url.id)}
                  disabled={isDeleting && deletingId === url.id}
                >
                  {isDeleting && deletingId === url.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
