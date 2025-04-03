
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadDocument as uploadDocumentUtil } from '@/services/documentService';
import { syncDocumentWithOpenAI } from '@/utils/openAIDocumentSync';

interface UploadOptions {
  clientId: string;
  shouldUseAI?: boolean;
  syncToOpenAI?: boolean;
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
}

interface UploadResult {
  success: boolean;
  documentId?: number | string;
  error?: string;
  processed?: number;
  failed?: number;
}

export const useUnifiedDocumentUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const uploadDocument = async (file: File, options: UploadOptions = { clientId }) => {
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
      
      // Upload document using the document service
      const result = await uploadDocumentUtil(clientId, file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document');
      }
      
      console.log('Document uploaded successfully:', result);
      
      // Now sync with OpenAI if requested (default to false to prevent errors)
      if (options.syncToOpenAI === true) {
        try {
          console.log('Syncing document with OpenAI assistant...');
          setUploadProgress(85); // Update progress
          
          // Convert documentId to string if it's a number
          const documentIdString = result.documentId ? String(result.documentId) : undefined;
          
          const openAIResult = await syncDocumentWithOpenAI(clientId, file, documentIdString);
          
          if (!openAIResult.success) {
            console.error('Failed to sync document with OpenAI:', openAIResult.error);
            toast.warning(`Document uploaded but failed to sync with AI assistant: ${openAIResult.error}`);
          } else {
            console.log('Document synced with OpenAI assistant successfully');
            toast.success('Document uploaded and synced with AI assistant successfully');
          }
        } catch (openAIError) {
          console.error('Error syncing with OpenAI:', openAIError);
          toast.warning('Document uploaded but could not be synced with AI assistant');
        }
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Set the final result
      setUploadResult({
        success: true,
        documentId: result.documentId,
        processed: result.processed || 0,
        failed: result.failed || 0
      });
      
      toast.success('Document uploaded and processed successfully');
      
      return {
        success: true,
        documentId: result.documentId
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error uploading document'
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
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadResult
  };
};
