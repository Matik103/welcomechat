
import { useMutation } from '@tanstack/react-query';
import { WebsiteUrl } from '@/types/website-url';
import { supabase } from '@/integrations/supabase/client';

export function useWebsiteUrlsProcessing(clientId: string | undefined) {
  // Process website URL content
  const processWebsiteUrlMutation = useMutation({
    mutationFn: async (websiteUrl: WebsiteUrl) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // In a real implementation, we would call an API to process the website
      // For now, we'll just update the status in the database
      const { data, error } = await supabase
        .from('website_urls')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteUrl.id)
        .eq('client_id', clientId)
        .select();

      if (error) throw error;

      // Simulate a completed process after 2 seconds
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('website_urls')
          .update({
            status: 'completed',
            last_crawled: new Date().toISOString()
          })
          .eq('id', websiteUrl.id);

        if (updateError) {
          console.error('Error updating website status:', updateError);
        }
      }, 2000);

      return data[0] as WebsiteUrl;
    }
  });

  // Helper function to process a website URL
  const processWebsiteUrl = async (websiteUrl: WebsiteUrl) => {
    return await processWebsiteUrlMutation.mutateAsync(websiteUrl);
  };

  return {
    processWebsiteUrlMutation,
    processWebsiteUrl
  };
}
