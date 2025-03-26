
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentLink, DocumentLinkFormData, AccessStatus } from '@/types/document-processing';

export function useDriveLinks(clientId: string) {
  const queryClient = useQueryClient();
  
  // Fetch all document links for a client
  const fetchDocumentLinks = async (): Promise<DocumentLink[]> => {
    if (!clientId) return [];
    
    const { data, error } = await supabase
      .from('document_links')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching document links:', error);
      throw error;
    }
    
    return data as DocumentLink[];
  };
  
  // Add a new document link
  const addDocumentLink = async (linkData: DocumentLinkFormData): Promise<DocumentLink> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    
    const { data, error } = await supabase
      .from('document_links')
      .insert({
        client_id: clientId,
        link: linkData.link,
        refresh_rate: linkData.refresh_rate,
        document_type: linkData.document_type || 'document',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding document link:', error);
      throw error;
    }
    
    return data as DocumentLink;
  };
  
  // Delete a document link
  const deleteDocumentLink = async (linkId: number): Promise<void> => {
    const { error } = await supabase
      .from('document_links')
      .delete()
      .eq('id', linkId)
      .eq('client_id', clientId);
    
    if (error) {
      console.error('Error deleting document link:', error);
      throw error;
    }
  };
  
  // Check the access status of a document link
  const checkLinkAccess = async (link: string): Promise<AccessStatus> => {
    try {
      // Call Edge Function to check access
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/check-drive-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({ url: link })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error checking link access:', result);
        return 'unknown';
      }
      
      return result.isAccessible ? 'granted' : 'denied';
    } catch (error) {
      console.error('Error in checkLinkAccess:', error);
      return 'unknown';
    }
  };
  
  // Use useQuery to fetch document links
  const { 
    data: documentLinks = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['documentLinks', clientId],
    queryFn: fetchDocumentLinks,
    enabled: !!clientId
  });
  
  // Use mutations for add and delete operations
  const addLinkMutation = useMutation({
    mutationFn: addDocumentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    }
  });
  
  const deleteLinkMutation = useMutation({
    mutationFn: deleteDocumentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentLinks', clientId] });
    }
  });
  
  // State for link validation
  const [isValidating, setIsValidating] = useState(false);
  
  // Function to validate a link before adding
  const validateLink = async (link: string): Promise<{ isValid: boolean; message: string }> => {
    setIsValidating(true);
    try {
      const accessStatus = await checkLinkAccess(link);
      
      if (accessStatus === 'granted') {
        return { isValid: true, message: 'Link is accessible' };
      } else if (accessStatus === 'denied') {
        return { isValid: false, message: 'This link is not publicly accessible' };
      } else {
        return { isValid: true, message: 'Could not verify access status, but will attempt to process' };
      }
    } catch (error) {
      console.error('Error validating link:', error);
      return { isValid: false, message: 'Error validating link' };
    } finally {
      setIsValidating(false);
    }
  };
  
  return {
    documentLinks,
    isLoading,
    error,
    isValidating,
    addDocumentLink: addLinkMutation,
    deleteDocumentLink: deleteLinkMutation,
    validateLink,
    refetch
  };
}
