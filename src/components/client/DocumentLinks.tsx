
import { useState, useEffect } from 'react';
import { useDocumentLinks } from '@/hooks/useDocumentLinks';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ExecutionStatus } from './ExecutionStatus';

interface DocumentLinksProps {
  clientId?: string;
}

export function DocumentLinks({ clientId }: DocumentLinksProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { documentLinks, isLoading: isLoadingLinks, deleteDocumentLink, error: linksError } = useDocumentLinks(clientId);
  
  // Use the document upload hook
  const { upload, isUploading: isUploadingDoc } = useUnifiedDocumentUpload();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !clientId) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    
    try {
      await upload(selectedFile, {
        clientId,
        onSuccess: (result) => {
          console.log('Document uploaded successfully:', result);
          toast.success('Document uploaded successfully');
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error: Error) => {
          console.error('Error uploading document:', error);
          toast.error(`Failed to upload document: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteDocumentLink(id);
      toast.success('Document link removed successfully');
    } catch (error) {
      console.error('Error deleting document link:', error);
      toast.error(`Failed to delete document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoadingLinks) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading document links...</span>
      </div>
    );
  }

  if (linksError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p>Error loading document links: {linksError.toString()}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Document Links</CardTitle>
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <FilePlus className="mr-1 h-4 w-4" />
            Select File
          </Button>
          {selectedFile && (
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedFile && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">Selected file: {selectedFile.name}</p>
          </div>
        )}

        {documentLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No document links added yet.</p>
            <p className="text-sm mt-1">Upload documents to enhance your AI assistant's knowledge.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.file_name || 'Unknown file'}</TableCell>
                  <TableCell>{link.mime_type || 'Unknown type'}</TableCell>
                  <TableCell>{link.created_at ? format(new Date(link.created_at), 'MMM d, yyyy') : 'Unknown'}</TableCell>
                  <TableCell>
                    <ExecutionStatus status={link.access_status || 'unknown'} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Add missing import
import { useRef } from 'react';
