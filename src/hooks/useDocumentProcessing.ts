
import { useState } from 'react';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { uploadDocument, processDocument } from '@/services/documentProcessingService';
import { toast } from 'sonner';

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
      // Show initial toast
      toast.loading(`Uploading document: ${file.name}`);
      
      // Create complete options by merging with defaults
      const processingOptions: DocumentProcessingOptions = {
        clientId,
        agentName: agentName || 'AI Assistant',
        onUploadProgress: (progress) => setUploadProgress(progress),
        processingMethod: 'llamaparse', // Default to LlamaParse processing
        integrateWithOpenAI: true, // Enable OpenAI Assistant integration
        ...options
      };

      // Step 1: Upload the document to storage
      const documentPath = await uploadDocument(file, processingOptions);
      
      toast.loading(`Processing document with LlamaParse: ${file.name}`);
      
      // Step 2: Process the document with LlamaParse
      const result = await processDocument(documentPath, processingOptions);
      
      // Step 3: Notify the user
      if (result.success) {
        toast.success(`Document "${file.name}" uploaded and processing started`);
      } else {
        toast.error(`Error processing document: ${result.error}`);
      }
      
      setUploadResult(result);
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const errorResult: DocumentProcessingResult = {
        success: false,
        status: 'failed',
        documentId: 'error-' + Date.now(),
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
    uploadResult: uploadResult || {
      success: false,
      status: 'none',
      documentId: ''
    }
  };
};
