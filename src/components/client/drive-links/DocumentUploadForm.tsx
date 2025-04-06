import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { File, Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UploadProgress } from '@/hooks/useUnifiedDocumentUpload';

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
}

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  onSubmitDocument,
  isUploading,
  uploadProgress
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    try {
      await onSubmitDocument(selectedFile);
      // Only clear the selected file if upload was successful
      if (!isUploading) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressPercentage = uploadProgress 
    ? Math.round((uploadProgress.uploadedBytes / uploadProgress.totalBytes) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile && (
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drag and drop a document here, or{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                browse
              </Button>
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOCX, TXT, CSV (Max 20MB)
            </p>
          </div>
        )}
        
        {selectedFile && (
          <div className="flex items-center">
            <File className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            
            {!isUploading && (
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-auto"
                onClick={handleClearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.docx,.txt,.csv"
          disabled={isUploading}
        />
      </div>
      
      {isUploading && uploadProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progressPercentage < 100 ? 'Uploading...' : 'Upload complete!'}</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} />
        </div>
      )}
      
      {selectedFile && !isUploading && (
        <Button 
          onClick={handleSubmit} 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      )}
    </div>
  );
};
