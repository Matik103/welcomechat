
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrlFormData, WebsiteUrl } from '@/types/website-url';

export function useWebsiteUrlsMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();

  // Add a website URL
  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (data: WebsiteUrlFormData) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data: newUrl, error } = await supabase
        .from('website_urls')
        .insert([
          {
            url: data.url,
            refresh_rate: data.refresh_rate,
            client_id: clientId,
            status: 'pending',
            metadata: data.metadata || {}
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return newUrl as WebsiteUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websiteUrls', clientId] });
    }
  });

  // Delete a website URL
  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('website_urls')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websiteUrls', clientId] });
    }
  });

  // Helper function to add a website URL
  const addWebsiteUrl = async (data: WebsiteUrlFormData) => {
    return await addWebsiteUrlMutation.mutateAsync(data);
  };

  // Helper function to delete a website URL
  const deleteWebsiteUrl = async (id: number) => {
    return await deleteWebsiteUrlMutation.mutateAsync(id);
  };

  return {
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    addWebsiteUrl,
    deleteWebsiteUrl
  };
}
