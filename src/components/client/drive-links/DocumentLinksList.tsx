
import React from 'react';
import { DocumentLink } from '@/types/document-processing';
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
import { formatDate } from '@/utils/stringUtils';

export interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (linkId: number) => Promise<void>;
  isLoading: boolean;
  isDeleting: boolean;
}

export const DocumentLinksList: React.FC<DocumentLinksListProps> = ({
  links,
  onDelete,
  isLoading,
  isDeleting
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-sm text-gray-500">No documents added yet</p>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case 'accessible':
        return "bg-green-100 text-green-800";
      case 'inaccessible':
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
          <TableHead>Document Link</TableHead>
          <TableHead>Added</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            <TableCell>
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {link.link.length > 50 ? `${link.link.substring(0, 50)}...` : link.link}
              </a>
            </TableCell>
            <TableCell>{formatDate(link.created_at)}</TableCell>
            <TableCell>
              {link.access_status && (
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(link.access_status)}`}>
                  {link.access_status.charAt(0).toUpperCase() + link.access_status.slice(1)}
                </span>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(link.id)}
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
