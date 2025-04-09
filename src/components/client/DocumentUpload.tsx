
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useUnifiedDocumentUpload } from '../../hooks/useUnifiedDocumentUpload';
import { Loader2 } from 'lucide-react';
import { PDF_PROCESSING } from '@/config/env';

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: { success: boolean; documentId?: string; error?: string; publicUrl?: string; fileName?: string }) => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { upload } = useUnifiedDocumentUpload({
    clientId,
    onSuccess: (result) => {
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    },
    onProgress: (progress) => {
      setUploadProgress(progress);
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }

    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        setUploadProgress(0);
        
        // File size check
        if (file.size > PDF_PROCESSING.maxFileSize) {
          toast.error(`File ${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is ${PDF_PROCESSING.maxFileSize / (1024 * 1024)}MB.`);
          continue;
        }
        
        // Display file size for large files
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const isLargeFile = file.size > 10 * 1024 * 1024;
        
        if (isLargeFile) {
          toast.info(
            `Processing large file: ${file.name} (${fileSizeMB}MB)`, 
            { description: "This may take several minutes. Please don't close this tab." }
          );
        } else {
          toast.info(`Uploading ${file.name} (${fileSizeMB}MB)...`);
        }
        
        const result = await upload(file);
        
        if (result.success && result.documentId) {
          toast.success(`${file.name} uploaded successfully!`);
          if (onUploadComplete) {
            onUploadComplete(result);
          }
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [clientId, upload, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: PDF_PROCESSING.maxFileSize // Set max file size based on configuration
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p>Uploading... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {uploadProgress > 40 && uploadProgress < 80 ? 
                "Processing PDF text - this may take several minutes for large files..." : 
                ""}
            </p>
          </div>
        ) : isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <div>
            <p>Drag and drop files here, or click to select files</p>
            <p className="text-sm text-gray-500 mt-2">Supports: PDF, Word, Excel, and Text files</p>
            <p className="text-xs text-gray-500">Maximum file size: {PDF_PROCESSING.maxFileSize / (1024 * 1024)}MB</p>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="text-xs text-gray-500 italic px-2">
          <p>Large PDF files require more processing time. Please be patient.</p>
          <p>For best results, ensure your PDF is text-searchable rather than scanned images.</p>
        </div>
      )}
    </div>
  );
}
