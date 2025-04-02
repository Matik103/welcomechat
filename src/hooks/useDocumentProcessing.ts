
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  uploadDocument, 
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

  return {
    documents: data || [],
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation,
    refetch
  };
}
