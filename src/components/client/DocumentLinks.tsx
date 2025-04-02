import React, { useState, useEffect } from 'react';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Upload, AlertCircle, FileIcon, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatFileSize } from '@/utils/formatters';

interface DocumentLinksProps {
  clientId: string;
}

export function DocumentLinks({ clientId }: DocumentLinksProps) {
  const [newLink, setNewLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { documentLinks, isLoading, addDocumentLink, deleteDocumentLink, refetch } = useDocumentLinks(clientId);
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  useEffect(() => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }
    refetch();
  }, [clientId, refetch]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink) {
      toast.error('Please enter a valid link');
      return;
    }

    try {
      await addDocumentLink.mutateAsync({
        link: newLink,
        document_type: 'web_page', // Changed from 'url' to 'web_page' which is valid in DocumentType
        refresh_rate: 30
      });
      setNewLink('');
      toast.success('Link added successfully');
      refetch();
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add link');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument(file);
      toast.success('File uploaded successfully');
      refetch();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const handleDelete = async (linkId: number) => {
    try {
      await deleteDocumentLink.mutateAsync(linkId);
      toast.success('Document deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Client ID is required to manage documents</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="animate-spin h-8 w-8" />
        <p className="text-sm text-gray-500">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddLink} className="flex gap-2">
        <Input
          type="url"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Enter document link (e.g., Google Drive)"
          className="flex-1"
          disabled={addDocumentLink.isPending}
        />
        <Button 
          type="submit" 
          disabled={!newLink || addDocumentLink.isPending}
        >
          {addDocumentLink.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Adding...
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              Add Link
            </>
          )}
        </Button>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
            disabled={isUploading}
          />
          <Button type="button" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {documentLinks?.map((link) => (
          <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {link.storage_path ? (
                  <FileIcon className="h-4 w-4 text-blue-500" />
                ) : (
                  <LinkIcon className="h-4 w-4 text-green-500" />
                )}
                <a
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate block"
                >
                  {link.file_name || link.link}
                </a>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  Type: {link.document_type}
                </span>
                {link.file_size && (
                  <span className="text-xs text-gray-500">
                    Size: {formatFileSize(link.file_size)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Added: {new Date(link.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(link.id)}
              disabled={deleteDocumentLink.isPending}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {deleteDocumentLink.isPending ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
        {(!documentLinks || documentLinks.length === 0) && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No documents added yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a file or add a document link to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
