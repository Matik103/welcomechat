
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  processDocumentUrl, 
  uploadDocument, 
  checkDocumentProcessingStatus, 
  getDocumentsForClient 
} from '@/services/documentProcessingService';
import { DocumentType, DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';

export function useDocumentProcessing(clientId: string) {
  // Query to fetch document processing jobs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['document-processing', clientId],
    queryFn: () => getDocumentsForClient(clientId),
    enabled: !!clientId,
  });

  // Mutation to process a document URL
  const processDocument = useMutation({
    mutationFn: (params: { 
      documentUrl: string; 
      documentType: DocumentType | string; 
      agentName: string; 
    }) => processDocumentUrl(
      clientId, 
      params.documentUrl, 
      params.documentType, 
      params.agentName
    ),
    onSuccess: () => {
      toast.success('Document processing started');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation to upload a document
  const uploadDocumentMutation = useMutation({
    mutationFn: (params: { file: File; agentName: string }) => 
      uploadDocument(clientId, params.file, params.agentName),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error uploading document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation to check document processing status
  const checkStatus = useMutation({
    mutationFn: (jobId: string) => checkDocumentProcessingStatus(jobId),
    onSuccess: (data) => {
      // Properly type the data as DocumentProcessingResult
      const result = data as DocumentProcessingResult;
      
      if (result.success) {
        toast.success(`Document processed successfully: ${result.processed} items`);
      } else if (result.error) {
        toast.error(`Document processing failed: ${result.error}`);
      }
      refetch();
    }
  });

  return {
    documents: data || [],
    isLoading,
    error,
    processDocument,
    uploadDocument: uploadDocumentMutation,
    checkStatus,
    refetch
  };
}
