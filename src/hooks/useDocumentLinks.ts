
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AccessStatus } from '@/types/extended-supabase';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  created_at: string;
  document_type: string;
  access_status?: AccessStatus;
  notified_at?: string;
}

export interface DocumentLinkFormData {
  link: string;
  document_type: string;
  refresh_rate: number;
}

export const useDocumentLinks = (clientId?: string) => {
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Query to fetch document links for a client
  const {
    data: documentLinks,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document-links', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data as DocumentLink[];
    },
    enabled: !!clientId
  });

  // Mutation to add a document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      if (!clientId) throw new Error('Client ID is required');
      
      // Start validation process
      setIsValidating(true);
      
      try {
        // Check if link is accessible
        const { data: validationResult, error: validationError } = await supabase.functions
          .invoke('check-drive-access', {
            body: { url: data.link }
          });
        
        if (validationError) throw validationError;
        
        if (!validationResult?.isAccessible) {
          toast.error('This document link is not accessible. Please check permissions.');
          return;
        }
        
        // Add the document link
        const { data: newLink, error } = await supabase
          .from('document_links')
          .insert({
            client_id: clientId,
            link: data.link,
            document_type: data.document_type,
            refresh_rate: data.refresh_rate,
            access_status: 'accessible'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        toast.success('Document link added successfully');
        return newLink.id;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-links', clientId] });
    },
    onError: (error) => {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    }
  });

  // Mutation to delete a document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      return linkId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-links', clientId] });
      toast.success('Document link deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting document link:', error);
      toast.error('Failed to delete document link');
    }
  });

  return {
    documentLinks,
    isLoading,
    error,
    isValidating,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  };
};
