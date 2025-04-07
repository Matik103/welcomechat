
import React, { useState } from 'react';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, File } from 'lucide-react';

interface DocumentLinksProps {
  clientId: string;
}

export function DocumentLinks({ clientId }: DocumentLinksProps) {
  const { uploadDocument, isUploading } = useUnifiedDocumentUpload(clientId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const result = await uploadDocument(formData);
      if (result.success) {
        toast.success("Document uploaded successfully!");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(`Failed to upload document: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex items-center">
          <Input
            id="document"
            type="file"
            onChange={handleFileChange}
            className="flex-1"
          />
        </div>
        {selectedFile && (
          <div className="text-sm text-gray-500 flex items-center">
            <File className="h-4 w-4 mr-2" />
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
        <Button 
          type="submit" 
          disabled={isUploading || !selectedFile}
          className="w-full"
        >
          {isUploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </span>
          )}
        </Button>
      </form>
    </Card>
  );
}
