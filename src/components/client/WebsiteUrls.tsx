
import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { WebsiteUrl, WebsiteUrlFormData } from '@/types/website-url';
import { toast } from 'sonner';
import { truncateString } from '@/utils/stringUtils';
import { formatDate } from '@/utils/stringUtils';

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: WebsiteUrlFormData) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
  isClientView?: boolean;
}

export const WebsiteUrls = ({
  urls,
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  agentName,
  isClientView = false
}: WebsiteUrlsProps) => {
  const [newUrl, setNewUrl] = useState('');
  const [refreshRate, setRefreshRate] = useState(30); // Default 30 days
  const [isValidating, setIsValidating] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUrl) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    try {
      setIsValidating(true);
      // Attempt to validate URL
      let url = newUrl;
      
      // Add https:// if not present
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      try {
        // Validate URL format
        new URL(url);
      } catch (error) {
        toast.error('Please enter a valid URL');
        setIsValidating(false);
        return;
      }

      await onAdd({ 
        url, 
        refresh_rate: refreshRate
      });
      
      setNewUrl('');
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add website URL');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle delete
  const handleDelete = async (urlId: number) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      await onDelete(urlId);
    }
  };

  // Get status badge color
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">Add Website URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={isAdding || isValidating}
              className="flex-1"
            />
            <Input
              id="refresh_rate"
              type="number"
              min="1"
              placeholder="Refresh days"
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              disabled={isAdding || isValidating}
              className="w-full sm:w-32"
            />
            <Button type="submit" disabled={isAdding || !newUrl || isValidating}>
              {isAdding || isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isValidating ? "Validating..." : "Adding..."}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {agentName} will refresh content from this website every {refreshRate} days.
          </p>
        </div>
      </form>

      <div>
        <h3 className="font-medium mb-2">Website URLs</h3>
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading website URLs...</p>
          </div>
        ) : urls.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No website URLs have been added yet.
          </Card>
        ) : (
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
                      onClick={() => handleDelete(url.id)}
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
        )}
      </div>
    </div>
  );
};
