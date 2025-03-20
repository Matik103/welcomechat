
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DocumentUploadFormProps } from '@/types/document-processing';

export const DocumentUploadForm = ({
  onSubmitDocument,
  isUploading
}: DocumentUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      try {
        await onSubmitDocument(file);
        setFile(null);
        
        // Reset the file input
        const fileInput = document.getElementById('document-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="document-file">Select Document</Label>
          <Input
            id="document-file"
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Supported formats: PDF, Word, Excel, PowerPoint, and text files
          </p>
        </div>
        
        <Button
          type="submit"
          disabled={!file || isUploading}
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
              Upload Document
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
