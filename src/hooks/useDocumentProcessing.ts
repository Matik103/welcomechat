
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocumentsByClientId, deleteDocument, processDocument } from '@/services/documentProcessingService';
import { toast } from 'sonner';

export const useDocumentProcessing = (clientId: string) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDocumentId, setProcessingDocumentId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  // Fetch documents for client
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documents', clientId],
    queryFn: () => getDocumentsByClientId(clientId),
    enabled: !!clientId,
  });

  // Process document mutation
  const processDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      setIsProcessing(true);
      setProcessingDocumentId(documentId);
      try {
        return await processDocument(documentId.toString());
      } finally {
        setIsProcessing(false);
        setProcessingDocumentId(null);
      }
    },
    onSuccess: () => {
      toast.success('Document processing initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
    onError: (error) => {
      toast.error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      setIsDeleting(true);
      setDeletingDocumentId(documentId);
      try {
        return await deleteDocument(documentId);
      } finally {
        setIsDeleting(false);
        setDeletingDocumentId(null);
      }
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    processDocument: processDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isProcessing,
    processingDocumentId,
    isDeleting,
    deletingDocumentId,
  };
};
