import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: { success: boolean; documentId?: string; error?: string; publicUrl?: string; fileName?: string }) => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const { uploadDocument, isUploading, progress, reset } = useUnifiedDocumentUpload();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);

        toast.info(`Uploading ${file.name}...`);
        
        const result = await uploadDocument(formData);
        
        if (result.success) {
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
      reset();
    }
  }, [clientId, uploadDocument, onUploadComplete, reset]);

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
    }
  });

  return (
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
          <p>Uploading... {progress > 0 ? `${progress}%` : ''}</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <div>
          <p>Drag and drop files here, or click to select files</p>
          <p className="text-sm text-gray-500 mt-2">Supports: PDF, Word, Excel, and Text files</p>
          <p className="text-xs text-gray-400 mt-1">Maximum file size: 100MB</p>
        </div>
      )}
    </div>
  );
}
