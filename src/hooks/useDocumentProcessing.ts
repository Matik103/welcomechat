
import { useState } from 'react';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { uploadDocument, processDocument } from '@/services/documentProcessingService';

// Document processing hook
export const useDocumentProcessing = (clientId: string, agentName?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

  const handleDocumentUpload = async (file: File, options?: Partial<DocumentProcessingOptions>) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Create complete options by merging with defaults
      const processingOptions: DocumentProcessingOptions = {
        clientId,
        agentName,
        processingMethod: 'standard',
        onUploadProgress: (progress) => setUploadProgress(progress),
        ...options
      };

      // Upload the document
      const documentId = await uploadDocument(file, processingOptions);
      
      // Process the document
      const result = await processDocument(documentId, processingOptions);
      
      setUploadResult(result);
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorResult: DocumentProcessingResult = {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setUploadResult(errorResult);
      return errorResult;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    handleDocumentUpload,
    isUploading,
    uploadProgress,
    uploadResult
  };
};
