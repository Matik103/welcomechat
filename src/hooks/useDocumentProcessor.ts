
import { useState, useCallback } from 'react';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';

// Mock implementation for processDocumentWithLlamaParse
export const processDocumentWithLlamaParse = async (
  documentId: string, 
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  // Mock implementation with all required fields
  return {
    success: true,
    status: 'completed',
    documentId,
    documentUrl: `https://example.com/documents/${documentId}`,
    documentType: 'pdf',
    clientId: options.clientId,
    agentName: options.agentName || 'AI Assistant',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    chunks: [],
    metadata: {
      path: `documents/${documentId}`,
      processedAt: new Date().toISOString(),
      method: 'llamaparse',
      publicUrl: `https://example.com/documents/${documentId}`,
      totalChunks: 0,
      characterCount: 0,
      wordCount: 0,
      averageChunkSize: 0
    }
  };
};

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
          agentName: agentName || 'AI Assistant'
        });

        setProcessingResult(result);
        return result;
      } catch (error) {
        console.error('Error processing document:', error);
        setProcessingError(error instanceof Error ? error : new Error(String(error)));

        // Create a properly formed error result with all required fields
        const errorResult: DocumentProcessingResult = {
          success: false,
          status: 'failed',
          documentId,
          documentUrl: `https://example.com/documents/${documentId}`,
          documentType: 'unknown',
          clientId,
          agentName: agentName || 'AI Assistant',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
          chunks: [],
          metadata: {
            path: `documents/${documentId}`,
            processedAt: new Date().toISOString(),
            method: 'llamaparse',
            publicUrl: `https://example.com/documents/${documentId}`,
            totalChunks: 0,
            characterCount: 0,
            wordCount: 0,
            averageChunkSize: 0,
            error: error instanceof Error ? error.message : String(error)
          }
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
