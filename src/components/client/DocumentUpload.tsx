import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { Progress } from '@/components/ui/progress';

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: any) => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const { uploadDocument, isUploading, progress, error } = useUnifiedDocumentUpload(clientId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    uploadDocument(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="file"
          id="upload"
          className="hidden"
          onChange={handleFileChange}
        />
        <label htmlFor="upload">
          <Button asChild variant="outline" disabled={isUploading}>
            <span className="flex items-center space-x-2">
              <UploadCloud className="h-4 w-4" />
              <span>{selectedFile ? `Selected: ${selectedFile.name}` : 'Select File'}</span>
            </span>
          </Button>
        </label>
        {selectedFile && (
          <p className="text-sm text-gray-500 mt-1">
            File size: {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        )}
      </div>
      
      {error && (
        <div className="rounded-md p-4 bg-red-50 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div>
          <Progress value={progress} />
          <p className="text-sm text-gray-500 mt-1">
            Uploading... {progress.toFixed(0)}%
          </p>
        </div>
      )}

      <Button type="submit" disabled={!selectedFile || isUploading}>
        Upload Document
      </Button>
    </form>
  );
}
