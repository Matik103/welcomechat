
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadDocument } from '@/services/documentService';

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  processed?: number;
  failed?: number;
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadOptions {
  clientId: string;
  shouldProcessWithOpenAI?: boolean;
  agentName?: string;
}

export const useUnifiedDocumentUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleDocumentUpload = async (file: File, options: UploadOptions = { clientId }) => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      console.log(`Starting document upload for client ${clientId}`, { options });
      
      // Upload document using the unified service
      const result = await uploadDocument(clientId, file, {
        shouldProcessWithOpenAI: options.shouldProcessWithOpenAI,
        agentName: options.agentName
      });
      
      clearInterval(progressInterval);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document');
      }
      
      console.log('Document uploaded successfully:', result);
      
      setUploadProgress(100);
      setUploadResult({
        success: true,
        documentId: result.documentId,
        processed: result.processed,
        failed: result.failed,
        documentUrl: result.documentUrl,
        fileName: result.fileName,
        fileType: result.fileType
      });
      
      toast.success('Document uploaded successfully');
      
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error('Failed to upload document: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument: handleDocumentUpload,
    isUploading,
    uploadProgress,
    uploadResult
  };
};
