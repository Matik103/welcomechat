
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentUploadFormProps } from '@/types/document-processing';
import { Upload, X, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  onSubmitDocument,
  isUploading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (file.size > maxSize) {
      toast.error(`File size exceeds 20MB limit. Please upload a smaller file.`);
      return;
    }
    
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];
    
    if (!supportedTypes.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}. Please upload PDF, DOCX, TXT, or CSV.`);
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null); // Clear any previous errors
  };

  const handleFixPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await fixDocumentLinksRLS();
      if (result.success) {
        toast.success("Security permissions fixed successfully");
        setUploadError(null);
      } else {
        toast.error(`Failed to fix permissions: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      toast.error(`Error fixing permissions: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsFixingPermissions(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadError(null);
    try {
      await onSubmitDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if this is a permission related error
      const isPossiblePermissionError = 
        errorMessage.includes('permission denied') || 
        errorMessage.includes('not authorized') || 
        errorMessage.includes('violates row-level security') ||
        errorMessage.includes('bucket') ||
        errorMessage.includes('storage');
      
      if (isPossiblePermissionError) {
        setUploadError(`Permission error: ${errorMessage}. Try fixing permissions first.`);
      } else {
        setUploadError(`Upload failed: ${errorMessage}`);
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop a file here, or{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </Button>
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOCX, TXT, CSV (Max 20MB)
          </p>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.docx,.txt,.csv"
          />
        </div>
      </div>

      {uploadError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p>{uploadError}</p>
            {uploadError.includes('Permission') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFixPermissions}
                disabled={isFixingPermissions}
                className="mt-2 flex items-center gap-1"
              >
                {isFixingPermissions ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span> 
                    Fixing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" /> 
                    Fix Permissions
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="mt-4 border rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
