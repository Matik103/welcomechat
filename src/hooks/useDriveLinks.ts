
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';

export interface DocumentLinkFormData {
  link: string;
  document_type: DocumentType;
  refresh_rate?: number;
}

export function useDriveLinks(clientId: string) {
  const queryClient = useQueryClient();
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessStatus, setAccessStatus] = useState<any>(null);

  // Get document links
  const { 
    data: documentLinks = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['documentLinks', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DocumentLink[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Add a document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      // Check drive access first
      setIsCheckingAccess(true);
      try {
        // Use the Edge Function to check drive access
        // Since we can't directly access the protected properties, get the URL from the environment
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
        
        // Function to make a safe API call to the edge function
        const checkDriveAccess = async (url: string) => {
          const response = await fetch(`${supabaseUrl}/functions/v1/check-drive-access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add your Supabase anon key here if needed for the function
              'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
            },
            body: JSON.stringify({ url })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to check drive access: ${response.statusText}`);
          }
          
          return await response.json();
        };
        
        const accessResult = await checkDriveAccess(data.link);
        setAccessStatus(accessResult);
        
        if (!accessResult.isAccessible) {
          throw new Error(`Cannot access this document. ${accessResult.error || 'Please check the URL and permissions.'}`);
        }
        
        // If accessible, add the document link
        const { data: newLink, error } = await supabase
          .from('document_links')
          .insert({
            client_id: clientId,
            link: data.link,
            document_type: data.document_type,
            refresh_rate: data.refresh_rate || 7,
            status: 'pending',
          })
          .select()
          .single();
        
        if (error) throw error;
        return newLink;
      } finally {
        setIsCheckingAccess(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document link added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add document link: ${error.message}`);
    }
  });

  // Delete a document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document link removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove document link: ${error.message}`);
    }
  });

  // Process a document link
  const processDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      const { data, error } = await supabase
        .from('document_links')
        .update({ status: 'processing' })
        .eq('id', linkId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Here you would trigger your document processing service
      // This is a placeholder for the actual processing logic
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document processing started');
    },
    onError: (error) => {
      toast.error(`Failed to process document: ${error.message}`);
    }
  });

  return {
    documentLinks,
    isLoading,
    error,
    refetch,
    addDocumentLink: addDocumentLink.mutateAsync,
    isAddingLink: addDocumentLink.isPending,
    deleteDocumentLink: deleteDocumentLink.mutateAsync,
    isDeletingLink: deleteDocumentLink.isPending,
    processDocumentLink: processDocumentLink.mutateAsync,
    isProcessingLink: processDocumentLink.isPending,
    isCheckingAccess,
    accessStatus
  };
}
