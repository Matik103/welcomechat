
import { useState, useRef } from 'react';
import { useDriveLinks } from '@/hooks/useDriveLinks';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilePlus, Link, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ExecutionStatus } from './ExecutionStatus';

interface DriveLinksProps {
  clientId?: string;
}

export function DriveLinks({ clientId }: DriveLinksProps) {
  const [newLink, setNewLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    driveLinks, 
    isLoading: isLoadingLinks, 
    addDriveLink, 
    deleteDriveLink
  } = useDriveLinks(clientId);
  
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
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle new drive link submission
  const handleAddLink = async () => {
    if (!newLink.trim() || !clientId) {
      toast.error('Please enter a valid Google Drive link');
      return;
    }

    setIsAdding(true);
    try {
      await addDriveLink(newLink.trim());
      toast.success('Google Drive link added successfully');
      setNewLink('');
    } catch (error) {
      console.error('Error adding drive link:', error);
      toast.error(`Failed to add drive link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle drive link deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteDriveLink(id);
      toast.success('Drive link removed successfully');
    } catch (error) {
      console.error('Error deleting drive link:', error);
      toast.error(`Failed to delete drive link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoadingLinks) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading drive links...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Drive Links</CardTitle>
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

        <div className="flex items-center space-x-2 mb-4">
          <Input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="flex-1"
          />
          <Button 
            onClick={handleAddLink} 
            disabled={isAdding || !newLink.trim()}
            size="sm"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Add Link
              </>
            )}
          </Button>
        </div>

        {driveLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No drive links added yet.</p>
            <p className="text-sm mt-1">Add Google Drive links to enhance your AI assistant's knowledge.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driveLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium truncate max-w-xs">
                    <div className="flex items-center">
                      <Link className="h-4 w-4 mr-2 text-blue-500" />
                      <a 
                        href={link.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate"
                      >
                        {link.link}
                      </a>
                    </div>
                  </TableCell>
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
