
import { useState } from 'react';
import { uploadAndProcessDocument } from '@/services/documentProcessingService';
import { toast } from 'sonner';

export interface DocumentProcessingOptions {
  clientId: string;
  agentName: string;
}

export const useDocumentProcessing = (options: DocumentProcessingOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadDocument = async (file: File, documentUrl?: string) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setProgress(10);
      
      const result = await uploadAndProcessDocument({
        file,
        clientId: options.clientId,
        agentName: options.agentName,
        documentUrl
      });
      
      setProgress(100);
      toast.success('Document uploaded and processed successfully');
      return result;
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error('Failed to process document');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    progress
  };
};
