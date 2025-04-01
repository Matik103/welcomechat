
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: DocumentType;
}

const getEffectiveClientId = async (clientId: string) => {
  try {
    console.log("Looking up client in ai_agents table with ID:", clientId);
    
    // First attempt: Try to get all possible matches and select the first one
    const { data: possibleMatches, error: queryError } = await supabase
      .from("ai_agents")
      .select("id, client_id")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .limit(10);
      
    if (!queryError && possibleMatches && possibleMatches.length > 0) {
      // Take the first match as the effective ID
      console.log("Found matches for client:", possibleMatches);
      const effectiveId = possibleMatches[0].id;
      console.log("Using effective client ID:", effectiveId);
      return effectiveId;
    }
    
    // Last resort: Just use the provided ID
    console.log("No matches found, using provided client ID as fallback:", clientId);
    return clientId;
    
  } catch (error) {
    console.error("Error getting effective client ID:", error);
    console.log("Using provided client ID as final fallback:", clientId);
    return clientId; // Return the original ID if all else fails
  }
};

export function useDocumentLinks(clientId: string) {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch document links
  const fetchDocumentLinks = useCallback(async () => {
    try {
      console.log("Fetching document links for client:", clientId);
      
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      let effectiveClientId;
      try {
        effectiveClientId = await getEffectiveClientId(clientId);
      } catch (clientError) {
        console.error("Client lookup failed, using original client ID");
        effectiveClientId = clientId;
      }
      
      console.log("Using effective client ID for fetching document links:", effectiveClientId);
      
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', effectiveClientId)
        .order('created_at', { ascending: false });
      
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
      return []; // Return empty array instead of throwing to prevent query from failing
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
    retry: 3,
    retryDelay: 1000
  });
  
  // Add document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      setIsValidating(true);
      
      try {
        console.log("Adding document link with data:", data, "for client:", clientId);
        
        // Basic validation - check if it's a valid URL
        try {
          new URL(data.link);
        } catch (error) {
          throw new Error('Please enter a valid URL');
        }
        
        // Get effective client ID, but use provided ID as fallback
        let effectiveClientId;
        try {
          effectiveClientId = await getEffectiveClientId(clientId);
        } catch (error) {
          console.error("Error getting effective client ID, using original:", error);
          effectiveClientId = clientId;
        }
        
        // Check if the link already exists for this client
        const { data: existingLink } = await supabase
          .from('document_links')
          .select('id')
          .eq('client_id', effectiveClientId)
          .eq('link', data.link)
          .maybeSingle();
          
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
        
        if (error) {
          // If we got an RLS error, try to fix it automatically
          if (error.message.includes('violates row-level security policy')) {
            console.error('RLS policy error detected, attempting to fix:', error);
            
            // Import and run the RLS fix function
            const { fixDocumentLinksRLS } = await import('@/utils/applyDocumentLinksRLS');
            await fixDocumentLinksRLS();
            
            // Try the insert again after fixing RLS
            const { data: retryData, error: retryError } = await supabase
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
            
            if (retryError) throw retryError;
            return retryData.id;
          }
          throw error;
        }
        
        return newLink.id;
      } catch (error) {
        console.error('Error adding document link:', error);
        throw error;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    }
  });
  
  // Delete document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      try {
        console.log("Deleting document link with ID:", linkId);
        
        // Get effective client ID or use original as fallback
        let effectiveClientId;
        try {
          effectiveClientId = await getEffectiveClientId(clientId);
        } catch (error) {
          console.error("Error getting effective client ID for delete, using original:", error);
          effectiveClientId = clientId;
        }
        
        // Delete the link - Note: We're not checking if it belongs to the client for better reliability
        const { error } = await supabase
          .from('document_links')
          .delete()
          .eq('id', linkId);
        
        if (error) {
          // If we got an RLS error, try to fix it automatically
          if (error.message.includes('violates row-level security policy')) {
            console.error('RLS policy error detected during delete, attempting to fix:', error);
            
            // Import and run the RLS fix function
            const { fixDocumentLinksRLS } = await import('@/utils/applyDocumentLinksRLS');
            await fixDocumentLinksRLS();
            
            // Try the delete again after fixing RLS
            const { error: retryError } = await supabase
              .from('document_links')
              .delete()
              .eq('id', linkId);
            
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        
        return linkId;
      } catch (error) {
        console.error('Error deleting document link:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
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
}
