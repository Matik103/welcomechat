
import { useState } from 'react';
import { DocumentProcessingStatus } from '@/types/document-processing';

// Hook to manage document processing status
export function useDocumentUrlProcessing() {
  const [processingStatus, setProcessingStatus] = useState<DocumentProcessingStatus>({
    status: 'pending',
    stage: 'init',
    progress: 0,
    message: 'Initializing document processing'
  });

  // Update processing status based on stage
  const updateProcessingStatus = (stage: string, progress: number, message: string, error?: string) => {
    setProcessingStatus({
      status: error ? 'failed' : (stage === 'complete' ? 'completed' : 'processing'),
      stage: stage as DocumentProcessingStatus['stage'],
      progress,
      message,
      error
    });
  };

  // Set status to uploading
  const setUploading = (message = 'Uploading document...', progress = 10) => {
    updateProcessingStatus('uploading', progress, message);
  };

  // Set status to processing
  const setProcessing = (message = 'Processing document...', progress = 40) => {
    updateProcessingStatus('processing', progress, message);
  };

  // Set status to parsing
  const setParsing = (message = 'Parsing document content...', progress = 70) => {
    updateProcessingStatus('parsing', progress, message);
  };

  // Set status to complete
  const setComplete = (message = 'Document processed successfully', progress = 100) => {
    updateProcessingStatus('complete', progress, message);
  };

  // Set status to failed
  const setFailed = (error: string, message = 'Document processing failed') => {
    updateProcessingStatus('failed', 0, message, error);
  };

  return {
    processingStatus,
    setUploading,
    setProcessing,
    setParsing,
    setComplete,
    setFailed
  };
}
