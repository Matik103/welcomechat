
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';
import { LlamaCloudService } from '@/services/LlamaCloudService';

export interface DocumentLinkFormData {
  link: string;
  document_type?: DocumentType;
  refresh_rate?: number;
  metadata?: Record<string, any>;
}

export function useDocumentLinks(clientId: string) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      try {
        // Set defaults
        const documentType = data.document_type || 'document';
        const refreshRate = data.refresh_rate || 30;
        
        // Insert the document link
        const { data: documentLink, error } = await supabase
          .from('document_links')
          .insert({
            client_id: clientId,
            link: data.link,
            document_type: documentType,
            refresh_rate: refreshRate,
            metadata: data.metadata || null
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (!documentLink) {
          throw new Error('Failed to create document link');
        }
        
        // Determine if this is a Google Drive link
        const isGoogleDriveLink = data.link.includes('drive.google.com') || 
                                data.link.includes('docs.google.com') ||
                                data.link.includes('sheets.google.com') ||
                                data.link.includes('slides.google.com');
        
        // Get agent name from metadata or use default
        const agentName = data.metadata?.agent_name || "AI Assistant";
        
        // Process with LlamaParse if it's a Google Drive link
        if (isGoogleDriveLink) {
          try {
            const parseResult = await LlamaCloudService.parseDocument(
              data.link,
              'google_drive',
              clientId,
              agentName
            );
            
            if (parseResult.success) {
              console.log("Google Drive link sent to LlamaParse for processing:", parseResult.jobId);
            } else {
              console.warn("Google Drive link added but LlamaParse processing failed:", parseResult.error);
              // We show a warning but don't fail the operation
              toast.warning("Link added, but content extraction might take some time.");
            }
          } catch (parseError) {
            console.error("Error sending Google Drive link to LlamaParse:", parseError);
            // Link was still added, so we show a warning but don't fail
            toast.warning("Link added, but content extraction encountered an issue.");
          }
        }
        
        return documentLink;
      } catch (error) {
        console.error('Error adding document link:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document link added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add document link: ${error.message}`);
    }
  });

  // Delete a document link
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      setDeletingId(linkId);
      try {
        const { error } = await supabase
          .from('document_links')
          .delete()
          .eq('id', linkId);
        
        if (error) throw error;
        return linkId;
      } catch (error) {
        console.error('Error deleting document link:', error);
        throw error;
      } finally {
        setDeletingId(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document link deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document link: ${error.message}`);
    }
  });

  return {
    documentLinks,
    isLoading,
    error,
    addDocumentLink,
    deleteDocumentLink,
    deletingId,
    refetch
  };
}
