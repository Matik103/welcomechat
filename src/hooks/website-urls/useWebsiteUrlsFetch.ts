
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrl } from '@/types/website-url';

export function useWebsiteUrlsFetch(clientId: string | undefined) {
  // Fetch website URLs
  const fetchWebsiteUrls = async () => {
    if (!clientId) {
      console.log('No client ID provided for fetching website URLs');
      return [];
    }

    console.log(`Fetching website URLs for client: ${clientId}`);
    
    try {
      const { data, error } = await supabase
        .from('website_urls')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching website URLs:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} website URLs`);
      return data as WebsiteUrl[];
    } catch (err) {
      console.error('Exception in fetchWebsiteUrls:', err);
      throw err;
    }
  };

  // Query to fetch website URLs
  const {
    data: websiteUrls = [],
    isLoading,
    isError,
    refetch: refetchWebsiteUrls
  } = useQuery({
    queryKey: ['websiteUrls', clientId],
    queryFn: fetchWebsiteUrls,
    enabled: !!clientId
  });

  return {
    websiteUrls,
    isLoading,
    isError,
    refetchWebsiteUrls
  };
}
