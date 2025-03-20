
import { useState, useCallback } from 'react';
import { DocumentProcessingResult } from '@/types/document-processing';
import { processDocumentWithLlamaParse } from '@/services/documentProcessingService';

export const useDocumentProcessor = (clientId: string, agentName?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);
  const [processingError, setProcessingError] = useState<Error | null>(null);

  const processDocument = useCallback(
    async (documentId: string): Promise<DocumentProcessingResult> => {
      setIsProcessing(true);
      setProcessingResult(null);
      setProcessingError(null);

      try {
        // Process with LlamaParse
        const result = await processDocumentWithLlamaParse(documentId, {
          clientId,
          agentName,
          processingMethod: 'llamaparse'
        });

        setProcessingResult(result);
        return result;
      } catch (error) {
        console.error('Error processing document:', error);
        setProcessingError(error instanceof Error ? error : new Error(String(error)));

        const errorResult: DocumentProcessingResult = {
          success: false,
          status: 'failed',
          documentId,
          error: error instanceof Error ? error.message : String(error)
        };

        setProcessingResult(errorResult);
        return errorResult;
      } finally {
        setIsProcessing(false);
      }
    },
    [clientId, agentName]
  );

  return {
    processDocument,
    isProcessing,
    processingResult,
    processingError
  };
};
