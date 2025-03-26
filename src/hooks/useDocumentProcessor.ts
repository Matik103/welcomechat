
import { useState } from 'react';
import { registerDocumentForProcessing, checkDocumentProcessingStatus } from '@/services/documentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';

export function useDocumentProcessor(clientId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [processingError, setProcessingError] = useState<Error | null>(null);
  
  const processDocument = async (documentUrl: string, documentType: string): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      return {
        success: false,
        error: 'Client ID is required',
        processed: 0,
        failed: 1,
        status: 'failed'
      };
    }
    
    setIsProcessing(true);
    setProcessingStatus('pending');
    setProcessingError(null);
    
    try {
      // Register the document for processing
      const documentId = await registerDocumentForProcessing(
        clientId,
        documentUrl,
        documentType
      );
      
      // You can poll the status here if needed, or leave it to the backend
      // For now, just return success
      
      setProcessingStatus('completed');
      
      return {
        success: true,
        documentId,
        processed: 1,
        failed: 0,
        status: 'pending',
        message: 'Document submitted for processing'
      };
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingError(error as Error);
      setProcessingStatus('failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processed: 0,
        failed: 1,
        status: 'failed'
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const checkStatus = async (documentId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> => {
    try {
      return await checkDocumentProcessingStatus(documentId);
    } catch (error) {
      console.error('Error checking document status:', error);
      return 'failed';
    }
  };
  
  return {
    processDocument,
    checkStatus,
    isProcessing,
    processingStatus,
    processingError
  };
}
