
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAndProcessDocument } from '@/services/documentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';

export const useDocumentProcessing = (clientId: string, agentName?: string) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File): Promise<DocumentProcessingResult> => {
      try {
        setUploadProgress(0);
        
        // Track upload progress
        const handleProgress = (progress: number) => {
          setUploadProgress(progress);
        };
        
        const result = await uploadAndProcessDocument(
          file,
          {
            clientId,
            agentName,
            onUploadProgress: handleProgress
          }
        );
        
        if (result.success) {
          toast.success('Document uploaded and processing started');
        } else {
          toast.error(`Failed to process document: ${result.error}`);
        }
        
        return result;
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Failed to upload document');
        throw error;
      } finally {
        // Ensure progress is reset after completion
        setUploadProgress(0);
      }
    }
  });

  // Simplified function to upload a document
  const uploadDocument = async (file: File): Promise<DocumentProcessingResult> => {
    return await uploadDocumentMutation.mutateAsync(file);
  };

  return {
    uploadDocument,
    uploadDocumentMutation,
    uploadProgress,
    isUploading: uploadDocumentMutation.isPending
  };
};
