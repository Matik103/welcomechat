
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadAndProcessDocument } from '@/services/documentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';

export const useDocumentProcessing = (clientId: string, agentName?: string) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = useMutation({
    mutationFn: async (file: File): Promise<DocumentProcessingResult> => {
      if (!clientId) {
        throw new Error('Client ID is required for document processing');
      }

      setUploadProgress(0);
      
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      try {
        const result = await uploadAndProcessDocument(file, {
          clientId,
          agentName: agentName || 'AI Assistant',
          processingMethod: 'firecrawl'
        });

        // Set to 100% when done
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!result.success) {
          toast.error(`Document processing failed: ${result.error}`);
        } else {
          toast.success('Document uploaded and processing started');
        }

        return result;
      } catch (error: any) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        toast.error(`Upload failed: ${error.message}`);
        throw error;
      }
    }
  });

  return {
    uploadDocument,
    uploadProgress,
    isUploading: uploadDocument.isPending
  };
};
