
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';

// Use the DocumentLinkFormData from types/document-processing instead of redefining it
import { DocumentLinkFormData } from '@/types/document-processing';

export function useDocumentLinks(clientId: string) {
  const queryClient = useQueryClient();

  // Get document links
  const { 
    data: documentLinks = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['documentLinks', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      // Get the correct client ID first
      const { data: clientRecord, error: clientError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("interaction_type", "config")
        .or(`id.eq.${clientId},client_id.eq.${clientId}`)
        .single();
        
      if (clientError) {
        console.error("Error finding client:", clientError);
        throw new Error("Could not find client record");
      }
      
      if (!clientRecord) {
        console.error("Client record not found");
        return [];
      }
      
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientRecord.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DocumentLink[];
    },
    enabled: !!clientId,
  });

  // Add a document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      try {
        // Get the correct client ID first
        const { data: clientRecord, error: clientError } = await supabase
          .from("ai_agents")
          .select("id")
          .eq("interaction_type", "config")
          .or(`id.eq.${clientId},client_id.eq.${clientId}`)
          .single();
          
        if (clientError) {
          console.error("Error finding client:", clientError);
          throw new Error("Could not find client record");
        }
        
        if (!clientRecord) {
          throw new Error("Client record not found");
        }
      
        // Cast document_type to ensure type safety
        const documentType = data.document_type as DocumentType;
        
        // Insert the document link with the correct client ID
        const { data: newLink, error } = await supabase
          .from('document_links')
          .insert({
            client_id: clientRecord.id,
            link: data.link,
            document_type: documentType,
            refresh_rate: data.refresh_rate || 7,
            access_status: 'pending'
          })
          .select()
          .single();
        
        if (error) throw error;
        return newLink;
      } catch (error) {
        console.error("Error adding document link:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    },
    onError: (error) => {
      console.error('Error adding document link:', error);
      toast.error(`Failed to add document link: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    }
  });

  return {
    documentLinks,
    isLoading,
    error,
    isValidating: addDocumentLink.isPending,
    refetch,
    addDocumentLink,
    deleteDocumentLink
  };
}
