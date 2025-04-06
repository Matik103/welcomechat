import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentType } from '@/types/document-processing';
import { toast } from 'sonner';

export interface DocumentLinkFormData {
  link: string;
  document_type: DocumentType;
  refresh_rate?: number;
  metadata?: Record<string, any>;
}

export interface DriveAccessResult {
  isAccessible: boolean;
  accessLevel: string;
  fileType: string;
}

export interface UseDriveLinksResult {
  documentLinks: DocumentLink[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  addDocumentLink: (data: DocumentLinkFormData) => Promise<DocumentLink>;
  isAddingLink: boolean;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  isDeletingLink: boolean;
  processDocumentLink: (linkId: number) => Promise<DocumentLink>;
  isProcessingLink: boolean;
  isCheckingAccess: boolean;
  accessStatus: DriveAccessResult | null;
}

export function useDriveLinks(clientId: string): UseDriveLinksResult {
  const queryClient = useQueryClient();
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessStatus, setAccessStatus] = useState<DriveAccessResult | null>(null);

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
      
      if (error) throw new Error(error.message);
      return data as DocumentLink[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Add a document link
  const addDocumentLink = useMutation({
    mutationFn: async (data: DocumentLinkFormData): Promise<DocumentLink> => {
      // Check drive access first
      setIsCheckingAccess(true);
      try {
        // Function to make a safe API call to the edge function
        const checkDriveAccess = async (url: string): Promise<DriveAccessResult> => {
          try {
            // Use Supabase Functions API directly
            const { data: funcData, error: funcError } = await supabase.functions.invoke('check-drive-access', {
              body: { url }
            });
            
            if (funcError) {
              console.error("Error calling Supabase function:", funcError);
              throw new Error(`Failed to check drive access: ${funcError.message}`);
            }
            
            return funcData as DriveAccessResult;
          } catch (err) {
            console.error("Error in checkDriveAccess:", err);
            // Fallback - assume URL is valid but we couldn't check it
            return { 
              isAccessible: true,
              accessLevel: 'unknown',
              fileType: 'unknown'
            };
          }
        };
        
        // Try to validate the drive link, but don't block if validation fails
        let accessResult: DriveAccessResult;
        try {
          accessResult = await checkDriveAccess(data.link);
          setAccessStatus(accessResult);
        } catch (error) {
          console.warn("Drive access check failed, proceeding anyway:", error);
          // Set a default accessResult if the check fails
          accessResult = { 
            isAccessible: true, 
            accessLevel: 'unknown',
            fileType: 'unknown'
          };
        }
        
        // Prepare the document link data
        const documentLinkData = {
          client_id: clientId,
          link: data.link,
          document_type: data.document_type,
          refresh_rate: data.refresh_rate || 7,
          access_status: 'pending',
          metadata: data.metadata
        };
        
        // Add the document link
        const { data: newLink, error } = await supabase
          .from('document_links')
          .insert(documentLinkData)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        return newLink as DocumentLink;
      } finally {
        setIsCheckingAccess(false);
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
    mutationFn: async (linkId: number): Promise<void> => {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document link removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove document link: ${error.message}`);
    }
  });

  // Process a document link
  const processDocumentLink = useMutation({
    mutationFn: async (linkId: number): Promise<DocumentLink> => {
      const { data, error } = await supabase
        .from('document_links')
        .update({ access_status: 'pending' })
        .eq('id', linkId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as DocumentLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
      toast.success('Document processing started');
    },
    onError: (error: Error) => {
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
