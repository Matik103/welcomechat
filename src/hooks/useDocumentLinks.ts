
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: DocumentType;
}

export function useDocumentLinks(clientId: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch document links
  const fetchDocumentLinks = useCallback(async () => {
    try {
      console.log("Fetching document links for client:", clientId);
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) {
        console.error("Error fetching document links:", error);
        setError(error);
        throw error;
      }
      
      console.log("Retrieved document links:", data);
      return data as DocumentLink[];
    } catch (error) {
      console.error("Error in document links fetch:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [clientId]);
  
  const { 
    data: documentLinks = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['documentLinks', clientId],
    queryFn: fetchDocumentLinks,
    enabled: !!clientId,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Add document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData): Promise<void> => {
      try {
        console.log("Adding document link with data:", data, "for client:", clientId);
        
        const { error } = await supabase.from('document_links').insert({
          client_id: clientId,
          link: data.link,
          refresh_rate: data.refresh_rate,
          document_type: data.document_type,
        });
        
        if (error) throw error;
      } catch (error) {
        console.error("Error in add document link mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    },
  });
  
  // Delete document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number): Promise<void> => {
      try {
        console.log("Deleting document link with ID:", linkId);
        
        const { error } = await supabase
          .from('document_links')
          .delete()
          .eq('id', linkId)
          .eq('client_id', clientId);
        
        if (error) throw error;
      } catch (error) {
        console.error("Error in delete document link mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    },
  });
  
  return {
    documentLinks,
    isLoading,
    error,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  };
}
