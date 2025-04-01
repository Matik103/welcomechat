
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
    
    // First attempt: Try to get the client by exact ID match
    const { data: directMatch, error: directError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("id", clientId)
      .limit(1)
      .maybeSingle();
      
    if (!directError && directMatch) {
      console.log("Found client by direct ID match:", directMatch.id);
      return directMatch.id;
    }
    
    // Second attempt: Try by client_id field
    const { data: clientIdMatch, error: clientIdError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("client_id", clientId)
      .limit(1)
      .maybeSingle();
      
    if (!clientIdError && clientIdMatch) {
      console.log("Found client by client_id match:", clientIdMatch.id);
      return clientIdMatch.id;
    }
    
    // Third attempt: Try more flexible search
    const { data: results, error: queryError } = await supabase
      .from("ai_agents")
      .select("id")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .limit(1);
      
    if (!queryError && results && results.length > 0) {
      console.log("Found client with flexible query:", results[0].id);
      return results[0].id;
    }
    
    // Last attempt: Try with interaction_type filter removed
    const { data: lastResults, error: lastError } = await supabase
      .from("ai_agents")
      .select("id")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .limit(1);
      
    if (!lastError && lastResults && lastResults.length > 0) {
      console.log("Found client without interaction_type filter:", lastResults[0].id);
      return lastResults[0].id;
    }
    
    console.error("All attempts to find client failed for ID:", clientId);
    console.error("Direct match error:", directError);
    console.error("Client ID match error:", clientIdError);
    console.error("Flexible query error:", queryError);
    console.error("Last attempt error:", lastError);
    
    throw new Error(`Could not find client record for ID: ${clientId}`);
  } catch (error) {
    console.error("Error getting effective client ID:", error);
    throw error;
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
        console.error("Client lookup failed, trying fallback approach");
        
        // Direct query as fallback
        const { data: directData } = await supabase
          .from('document_links')
          .select('client_id')
          .eq('client_id', clientId)
          .limit(1)
          .maybeSingle();
          
        if (directData && directData.client_id) {
          effectiveClientId = directData.client_id;
          console.log("Using client ID from existing document links:", effectiveClientId);
        } else {
          // Just use the provided ID as last resort
          console.log("Using provided client ID as fallback:", clientId);
          effectiveClientId = clientId;
        }
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
    retry: 2,
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
