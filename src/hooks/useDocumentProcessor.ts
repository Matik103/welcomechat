
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerDocumentProcessing, getDocumentProcessingStatus } from '@/services/documentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';

export const useDocumentProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [processedJobs, setProcessedJobs] = useState<Record<string, DocumentProcessingResult>>({});

  const processDocumentMutation = useMutation({
    mutationFn: async ({ clientId, url, type }: { clientId: string; url: string; type: string }): Promise<DocumentProcessingResult> => {
      try {
        setIsProcessing(true);
        setProcessingStatus('Registering document for processing...');
        
        // Register the document for processing
        const jobId = await registerDocumentProcessing({
          client_id: clientId,
          document_url: url,
          document_type: type
        });
        
        if (!jobId) {
          throw new Error('Failed to register document for processing');
        }
        
        setProcessingStatus('Checking processing status...');
        
        // Check the initial status
        const result = await getDocumentProcessingStatus(jobId);
        
        setProcessedJobs(prev => ({
          ...prev,
          [jobId]: result
        }));
        
        return {
          success: result.success,
          error: result.error,
          processed: 0,
          failed: 0
        };
      } catch (error) {
        console.error('Error processing document:', error);
        throw error;
      } finally {
        setIsProcessing(false);
        setProcessingStatus(null);
      }
    }
  });

  return {
    processDocument: processDocumentMutation.mutateAsync,
    isProcessing: isProcessing || processDocumentMutation.isPending,
    processingError: processDocumentMutation.error,
    processingStatus,
    processedJobs
  };
};
