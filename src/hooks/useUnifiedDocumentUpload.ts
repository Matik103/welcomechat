
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadDocument } from '@/services/documentService';
import { fixDocumentContentRLS } from '@/utils/applyDocumentContentRLS';

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
  onError?: (error: Error | string) => void;
}

export const useUnifiedDocumentUpload = ({ 
  clientId, 
  onSuccess, 
  onError 
}: UploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);

  const fixPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await fixDocumentContentRLS();
      toast.success('Permissions fixed. Please try uploading again.');
      return result.success;
    } catch (error) {
      console.error('Error fixing permissions:', error);
      toast.error('Failed to fix permissions: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsFixingPermissions(false);
    }
  };

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
        // Check if it's a permissions issue
        if (result.error && (result.error.includes('security policy') || result.error.includes('permission denied'))) {
          toast.error('Permission denied. Attempting to fix permissions...');
          const fixed = await fixPermissions();
          
          if (fixed) {
            toast.info('Please try uploading the file again.');
            throw new Error('Permissions fixed. Please try again.');
          } else {
            throw new Error(result.error || 'Failed to upload document and fix permissions');
          }
        } else {
          throw new Error(result.error || 'Failed to upload document');
        }
      }
      
      console.log('Document uploaded successfully:', result);
      
      setUploadProgress(100);
      
      // Make sure publicUrl is available in the result
      const enhancedResult = {
        ...result,
        // Use documentUrl as publicUrl if publicUrl is not available
        publicUrl: result.publicUrl || result.documentUrl || '',
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
    uploadResult,
    fixPermissions,
    isFixingPermissions
  };
};
