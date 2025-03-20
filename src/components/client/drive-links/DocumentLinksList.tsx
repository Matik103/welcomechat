
import React from 'react';
import { DocumentLink } from '@/types/document-processing';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/stringUtils';
import { Card } from '@/components/ui/card';

export interface DocumentLinksListProps {
  links: DocumentLink[];
  isLoading: boolean;
  onDelete: (id: number) => Promise<void>;
  isDeleteLoading?: boolean;
  deletingId?: number | null;
}

export const DocumentLinksList = ({
  links,
  isLoading,
  onDelete,
  isDeleteLoading = false,
  deletingId = null
}: DocumentLinksListProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading document links...</p>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        No document links have been added yet
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Link</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Added</TableHead>
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
                {link.link.length > 40 ? `${link.link.substring(0, 37)}...` : link.link}
              </a>
            </TableCell>
            <TableCell>{link.document_type}</TableCell>
            <TableCell>{formatDate(link.created_at)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(link.id)}
                disabled={isDeleteLoading && deletingId === link.id}
                className="p-0 h-8 w-8"
              >
                {isDeleteLoading && deletingId === link.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
                <span className="sr-only">Delete</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
