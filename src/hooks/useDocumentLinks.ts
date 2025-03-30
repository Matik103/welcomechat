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

const getEffectiveClientId = async (clientId: string) => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("interaction_type", "config")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .single();
      
    if (clientError) {
      console.error("Error finding client:", clientError);
      throw new Error("Could not find client record");
    }
    
    if (!clientData) {
      throw new Error("Client not found");
    }
    
    return clientData.id;
  } catch (error) {
    console.error("Error getting effective client ID:", error);
    throw error;
  }
};

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
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      try {
        const effectiveClientId = await getEffectiveClientId(clientId);
        
        const { data, error } = await supabase
          .from('document_links')
          .select('*')
          .eq('client_id', effectiveClientId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data) {
          return [];
        }
        
        return data as DocumentLink[];
      } catch (error) {
        console.error('Error fetching document links:', error);
        throw error;
      }
    },
    enabled: !!clientId,
    retry: 2,
    retryDelay: 1000
  });

  // Mutation to add a document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      setIsValidating(true);
      
      try {
        // Basic validation - check if it's a valid URL
        try {
          new URL(data.link);
        } catch (error) {
          throw new Error('Please enter a valid URL');
        }
        
        const effectiveClientId = await getEffectiveClientId(clientId);
        
        // Check if the link already exists for this client
        const { data: existingLink } = await supabase
          .from('document_links')
          .select('id')
          .eq('client_id', effectiveClientId)
          .eq('link', data.link)
          .single();
          
        if (existingLink) {
          throw new Error('This document link already exists');
        }
        
        // Add the document link with the correct client ID
        const { data: newLink, error } = await supabase
          .from('document_links')
          .insert({
            client_id: effectiveClientId,
            link: data.link,
            document_type: data.document_type,
            refresh_rate: data.refresh_rate,
            access_status: 'accessible'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return newLink.id;
      } catch (error) {
        console.error('Error adding document link:', error);
        throw error;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-links', clientId] });
    }
  });

  // Mutation to delete a document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      try {
        const effectiveClientId = await getEffectiveClientId(clientId);
        
        // Verify the link belongs to this client before deleting
        const { data: existingLink } = await supabase
          .from('document_links')
          .select('id')
          .eq('id', linkId)
          .eq('client_id', effectiveClientId)
          .single();
          
        if (!existingLink) {
          throw new Error('Document link not found or access denied');
        }
        
        const { error } = await supabase
          .from('document_links')
          .delete()
          .eq('id', linkId)
          .eq('client_id', effectiveClientId);
        
        if (error) throw error;
        
        return linkId;
      } catch (error) {
        console.error('Error deleting document link:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-links', clientId] });
    }
  });

  return {
    documentLinks: documentLinks || [],
    isLoading,
    error,
    isValidating,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  };
};
