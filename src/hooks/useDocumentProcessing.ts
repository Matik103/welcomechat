
import { useState } from 'react';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { uploadDocument } from '@/services/documentProcessingService';
import { DocumentProcessingService } from '@/services/documentProcessingService';
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

    // Create a toast ID to manage the toast
    let toastId = toast.loading(`Processing document: ${file.name}`);

    try {
      // Create complete options by merging with defaults
      const processingOptions: DocumentProcessingOptions = {
        clientId,
        agentName: agentName || 'AI Assistant',
        onUploadProgress: (progress) => setUploadProgress(progress),
        processingMethod: 'llamaparse', // Default to LlamaParse processing
        ...options
      };

      // Step 1: Upload the document to storage
      const documentPath = await uploadDocument(file, processingOptions);
      
      // Update toast to indicate document is now processing in the background
      toast.success(`Document uploaded successfully`, { id: toastId });
      toastId = null; // Clear toastId so we don't try to update it again
      
      // Step 2: Process the document with LlamaParse (happens in the background)
      const result = await DocumentProcessingService.processDocument(
        documentPath,
        file.type || 'application/pdf',
        clientId,
        processingOptions.agentName
      );
      
      setUploadResult(result);
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Make sure to dismiss the loading toast
      if (toastId) {
        toast.dismiss(toastId);
        toastId = null;
      }
      
      // Show specific error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Upload failed: ${errorMessage}`);
      
      const errorResult: DocumentProcessingResult = {
        success: false,
        status: 'failed',
        documentId: 'error-' + Date.now(),
        documentUrl: '',
        documentType: '',
        clientId,
        agentName: agentName || 'AI Assistant',
        startedAt: new Date().toISOString(),
        chunks: [],
        metadata: {
          path: '',
          processedAt: new Date().toISOString(),
          method: 'llamaparse',
          publicUrl: '',
          totalChunks: 0,
          characterCount: 0,
          wordCount: 0,
          averageChunkSize: 0,
          error: errorMessage
        }
      };
      
      setUploadResult(errorResult);
      return errorResult;
    } finally {
      // Always set uploading to false when done and clear any lingering toast
      setIsUploading(false);
      if (toastId) {
        toast.dismiss(toastId);
      }
    }
  };

  return {
    handleDocumentUpload,
    isUploading,
    uploadProgress,
    uploadResult: uploadResult || {
      success: false,
      status: 'none',
      documentId: '',
      documentUrl: '',
      documentType: '',
      clientId,
      agentName: agentName || 'AI Assistant',
      startedAt: new Date().toISOString(),
      chunks: [],
      metadata: {
        path: '',
        processedAt: new Date().toISOString(),
        method: '',
        publicUrl: '',
        totalChunks: 0,
        characterCount: 0,
        wordCount: 0,
        averageChunkSize: 0
      }
    }
  };
};
