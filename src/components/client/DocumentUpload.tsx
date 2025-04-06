import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { useUnifiedDocumentUpload } from '../../hooks/useUnifiedDocumentUpload';

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (documentId: string) => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { upload } = useUnifiedDocumentUpload();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }

    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        toast(`Uploading ${file.name}...`);
        
        const result = await upload(file, clientId);
        
        if (result.success && result.documentId) {
          toast.success(`${file.name} uploaded successfully!`);
          onUploadComplete?.(result.documentId);
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [clientId, upload, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <p>Uploading...</p>
      ) : isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <p>Drag and drop files here, or click to select files</p>
      )}
    </div>
  );
}
