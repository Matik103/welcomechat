
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentLinkFormData } from '@/types/document-processing';

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch drive links
  const fetchDocumentLinks = async () => {
    if (!clientId) {
      return [];
    }

    const { data, error } = await supabase
      .from('document_links')
      .select('*')
      .eq('client_id', clientId)
      .eq('document_type', 'google_drive')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DocumentLink[];
  };

  // Query to fetch document links
  const {
    data: documentLinks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['driveLinks', clientId],
    queryFn: fetchDocumentLinks,
    enabled: !!clientId
  });

  // Add a document link
  const addDocumentLinkMutation = useMutation({
    mutationFn: async (data: DocumentLinkFormData & { metadata?: any }) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data: newLink, error } = await supabase
        .from('document_links')
        .insert([
          {
            link: data.link,
            refresh_rate: data.refresh_rate,
            document_type: data.document_type,
            client_id: clientId,
            access_status: 'pending',
            metadata: data.metadata || {}
          }
        ])
        .select();

      if (error) throw error;
      return newLink[0] as DocumentLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driveLinks', clientId] });
    }
  });

  // Delete a document link
  const deleteDocumentLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driveLinks', clientId] });
    }
  });

  // Helper function to add a document link
  const addDocumentLink = async (data: DocumentLinkFormData & { metadata?: any }) => {
    return await addDocumentLinkMutation.mutateAsync(data);
  };

  // Helper function to delete a document link
  const deleteDocumentLink = async (id: number) => {
    return await deleteDocumentLinkMutation.mutateAsync(id);
  };

  return {
    documentLinks,
    isLoading,
    error,
    refetch,
    addDocumentLink,
    isAddingLink: addDocumentLinkMutation.isPending,
    deleteDocumentLink,
    isDeletingLink: deleteDocumentLinkMutation.isPending,
    deleteDocumentLinkMutation
  };
}
