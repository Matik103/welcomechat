
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrl } from '@/types/website-url';
import { toast } from 'sonner';
import { getEnvVariable } from '@/utils/envUtils';

export const useStoreWebsiteContent = (clientId: string) => {
  return useMutation({
    mutationFn: async (website: WebsiteUrl) => {
      try {
        // Get the Supabase URL from environment variables or use a fallback
        const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL') || 'http://localhost:54321';
        const supabaseKey = getEnvVariable('VITE_SUPABASE_ANON_KEY') || '';
        
        // Make a fetch call to the Supabase function
        const response = await fetch(`${supabaseUrl}/functions/v1/crawl-website`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            websiteId: website.id,
            clientId: clientId,
            url: website.url
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process website');
        }

        const result = await response.json();

        // Mark the website as processed
        await supabase
          .from('website_urls')
          .update({
            status: result.success ? 'completed' : 'failed',
            last_crawled: new Date().toISOString(),
            error: result.error || null
          })
          .eq('id', website.id);

        return { success: true };
      } catch (error) {
        console.error('Error storing website content:', error);
        
        // Update the website status to failed
        await supabase
          .from('website_urls')
          .update({
            status: 'failed',
            last_crawled: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', website.id);
          
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    onSuccess: () => {
      toast.success('Website content stored successfully');
    },
    onError: (error) => {
      toast.error(`Failed to store website content: ${error.message}`);
    }
  });
};
