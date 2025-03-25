
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DocumentUploadFormProps } from '@/types/document-processing';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

export const DocumentUploadForm = ({
  onSubmitDocument,
  isUploading
}: DocumentUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      // Validate file type
      const selectedFile = files[0];
      const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.pdf') && 
          !selectedFile.name.endsWith('.docx') && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.pptx') && 
          !selectedFile.name.endsWith('.txt') && 
          !selectedFile.name.endsWith('.csv')) {
        setErrorMsg('Unsupported file type. Please select a PDF, Word, Excel, PowerPoint, or text file.');
        return;
      }
      
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setErrorMsg('File is too large. Maximum size is 50MB.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      try {
        setErrorMsg(null);
        await onSubmitDocument(file);
        setFile(null);
        
        // Reset the file input
        const fileInput = document.getElementById('document-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        setErrorMsg(error instanceof Error ? error.message : 'Failed to upload document');
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
            Supported formats: PDF, Word, Excel, PowerPoint, and text files (Max 50MB)
          </p>
          {errorMsg && (
            <p className="text-sm text-destructive mt-1">{errorMsg}</p>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
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
