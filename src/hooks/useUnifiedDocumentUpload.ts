
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
  publicUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadOptions {
  clientId: string;
  shouldProcessWithOpenAI?: boolean;
  agentName?: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export const useUnifiedDocumentUpload = ({ 
  clientId, 
  onSuccess, 
  onError 
}: UploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const upload = async (file: File, options: Partial<UploadOptions> = {}) => {
    if (!clientId) {
      const error = new Error('Client ID is required');
      if (onError) onError(error);
      else toast.error('Client ID is required');
      return null;
    }

    setIsLoading(true);
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

      console.log(`Starting document upload for client ${clientId}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
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
      
      // Make sure publicUrl is available in the result
      const enhancedResult = {
        ...result,
        // Use documentUrl as publicUrl if publicUrl is not available
        publicUrl: result.documentUrl || result.publicUrl || '',
        fileName: file.name,
        fileType: file.type
      };
      
      setUploadResult(enhancedResult);
      
      if (onSuccess) onSuccess(enhancedResult);
      else toast.success(`Document "${file.name}" uploaded successfully`);
      
      return enhancedResult;
    } catch (error) {
      console.error('Error uploading document:', error);
      
      const errorResult = {
        success: false,
        fileName: file.name,
        fileType: file.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setUploadResult(errorResult);
      
      if (onError) onError(error instanceof Error ? error : new Error('Unknown error'));
      else toast.error('Failed to upload document: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upload,
    isLoading,
    uploadProgress,
    uploadResult
  };
};
