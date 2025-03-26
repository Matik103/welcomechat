
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentLink as DriveLink } from '@/types/document-processing'; 

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: string;
}

export function useDocumentLinks(clientId: string) {
  const [isValidating, setIsValidating] = useState(false);

  // Query to fetch document links
  const { data: documentLinks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documentLinks', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!clientId,
  });

  // Add document link mutation
  const addDocumentLink = useMutation({
    mutationFn: async (formData: DocumentLinkFormData) => {
      if (!clientId) throw new Error('Client ID is required');
      
      // Validate link before adding
      setIsValidating(true);
      let linkToAdd = formData.link;
      
      // Ensure link has https:// prefix
      if (!linkToAdd.startsWith('http://') && !linkToAdd.startsWith('https://')) {
        linkToAdd = `https://${linkToAdd}`;
      }
      
      try {
        // Check if the link is accessible
        const functionsUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/check-url-access`;
        const accessResponse = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_KEY}`
          },
          body: JSON.stringify({ url: linkToAdd })
        });
        
        const accessData = await accessResponse.json();
        
        if (!accessData.accessible) {
          throw new Error(`The URL ${linkToAdd} is not accessible. Please check the URL and try again.`);
        }
        
        // Insert the document link
        const { error } = await supabase
          .from('document_links')
          .insert({
            client_id: clientId,
            link: linkToAdd,
            refresh_rate: formData.refresh_rate,
            document_type: formData.document_type,
            access_status: 'accessible'
          });
        
        if (error) throw new Error(error.message);
        return linkToAdd;
      } catch (error) {
        console.error('Error adding document link:', error);
        throw error;
      } finally {
        setIsValidating(false);
      }
    },
  });

  // Delete document link mutation
  const deleteDocumentLink = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw new Error(error.message);
      return linkId;
    },
  });

  // Function to validate URL access
  const validateUrlAccess = async (url: string): Promise<boolean> => {
    setIsValidating(true);
    try {
      // Use the built-in URL constructor to validate URL format
      const _ = new URL(url);
      
      // Make a request to check if the URL is accessible
      const accessCheckUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/check-url-access`;
      const response = await fetch(accessCheckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_KEY}`
        },
        body: JSON.stringify({ url })
      });
      
      const result = await response.json();
      return result.accessible === true;
    } catch (error) {
      console.error('Error validating URL access:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    documentLinks,
    isLoading,
    error,
    isValidating,
    addDocumentLink,
    deleteDocumentLink,
    validateUrlAccess,
    refetch
  };
}
