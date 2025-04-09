
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrlFormData } from '@/types/website-url';

export function useWebsiteUrlsMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();

  // Add website URL mutation
  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (data: WebsiteUrlFormData & { client_id?: string }) => {
      if (!clientId && !data.client_id) {
        throw new Error('Client ID is required');
      }
      
      const websiteUrl = {
        client_id: data.client_id || clientId,
        url: data.url,
        refresh_rate: data.refresh_rate || 24, // Default to 24 hours
        created_at: new Date().toISOString()
      };
      
      const { data: result, error } = await supabase
        .from('website_urls')
        .insert([websiteUrl])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websiteUrls', clientId] });
    }
  });

  // Delete website URL mutation
  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (urlId: number) => {
      const { error } = await supabase
        .from('website_urls')
        .delete()
        .eq('id', urlId)
        .eq('client_id', clientId);
      
      if (error) throw error;
      return urlId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websiteUrls', clientId] });
    }
  });

  return {
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation
  };
}
