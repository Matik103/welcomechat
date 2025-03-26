
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentLink } from "@/types/document-processing";

// Define the form data interface here to avoid conflicts
export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: string;
}

export function useDocumentLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  // Query to fetch document links
  const { 
    data: documentLinks = [], 
    isLoading, 
    error, 
    refetch, 
    isRefetching = false // Use isRefetching instead of isValidating
  } = useQuery({
    queryKey: ["documentLinks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("document_links")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching document links:", error);
        throw error;
      }
      
      return data as DocumentLink[];
    },
    enabled: !!clientId,
  });

  // Add document link mutation
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData) => {
      if (!clientId) throw new Error("Client ID is required");
      
      const { data: result, error } = await supabase
        .from("document_links")
        .insert({
          client_id: clientId,
          link: data.link,
          document_type: data.document_type,
          refresh_rate: data.refresh_rate,
          access_status: "pending"
        })
        .select()
        .single();
        
      if (error) throw error;
      return result.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentLinks", clientId] });
    }
  });

  // Delete document link mutation
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from("document_links")
        .delete()
        .eq("id", linkId);
        
      if (error) throw error;
      return linkId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentLinks", clientId] });
    }
  });

  return {
    documentLinks,
    isLoading,
    error,
    isValidating: isRefetching,
    addDocumentLink,
    deleteDocumentLink,
    refetch
  };
}
