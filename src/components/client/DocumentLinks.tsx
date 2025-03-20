
import React, { useState } from 'react';
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
import { Loader2, Plus, Trash2, Upload, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DocumentLink } from '@/types/agent';
import { toast } from 'sonner';
import { truncateString, formatDate } from '@/utils/stringUtils';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDriveAccessCheck } from '@/hooks/useDriveAccessCheck';

interface DocumentLinksProps {
  documentLinks: DocumentLink[];
  onAdd: (data: { 
    link: string; 
    document_type: string; 
    refresh_rate: number;
  }) => Promise<void>;
  onDelete: (linkId: number) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  isUploading: boolean;
  uploadProgress: number;
  agentName: string;
}

export const DocumentLinks = ({
  documentLinks,
  onAdd,
  onDelete,
  onUpload,
  isLoading,
  isAdding,
  isDeleting,
  isUploading,
  uploadProgress,
  agentName
}: DocumentLinksProps) => {
  const [newLink, setNewLink] = useState('');
  const [documentType, setDocumentType] = useState<string>('google_drive');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Handle form submission for links
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLink) {
      toast.error('Please enter a valid link');
      return;
    }
    
    try {
      await onAdd({ 
        link: newLink, 
        document_type: documentType,
        refresh_rate: 30 // Default refresh rate: 30 days
      });
      
      setNewLink('');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add document link');
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      await onUpload(uploadFile);
      setUploadFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  // Handle delete
  const handleDelete = async (linkId: number) => {
    if (confirm('Are you sure you want to delete this document link?')) {
      await onDelete(linkId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Drive Link Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Add Document Link</Label>
            <div className="space-y-2">
              <Select 
                value={documentType} 
                onValueChange={setDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="google_sheet">Google Sheet</SelectItem>
                  <SelectItem value="text">Text Document</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  disabled={isAdding}
                  className="flex-1"
                />
                <Button type="submit" disabled={isAdding || !newLink}>
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* File Upload Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Upload Document</Label>
            <div className="space-y-2">
              <Input
                id="document-upload"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !uploadFile}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              {isUploading && (
                <Progress value={uploadProgress} className="h-2" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Document Links</h3>
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading document links...</p>
          </div>
        ) : documentLinks.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No document links have been added yet.
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentLinks.map((link) => (
                <DocumentLinkRow
                  key={link.id}
                  link={link}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

// Helper component to show document link rows
const DocumentLinkRow = ({ 
  link, 
  onDelete, 
  isDeleting 
}: { 
  link: DocumentLink; 
  onDelete: (id: number) => Promise<void>;
  isDeleting: boolean;
}) => {
  const { accessStatus, refreshStatus, isLoading } = useDriveAccessCheck(link.id);
  
  return (
    <TableRow>
      <TableCell>
        <a
          href={link.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {truncateString(link.link, 40)}
        </a>
      </TableCell>
      <TableCell>{link.document_type}</TableCell>
      <TableCell>{formatDate(link.created_at)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={`capitalize ${
            accessStatus === 'granted' ? 'text-green-600' :
            accessStatus === 'denied' ? 'text-red-600' :
            accessStatus === 'pending' ? 'text-amber-600' : 'text-gray-600'
          }`}>
            {accessStatus}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refreshStatus()} 
            disabled={isLoading}
            className="h-6 w-6"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
  );
};
