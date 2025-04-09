
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrl } from '@/types/website-url';

export function useWebsiteUrlsFetch(clientId: string | undefined) {
  // Fetch website URLs
  const fetchWebsiteUrls = async () => {
    if (!clientId) {
      return [];
    }

    const { data, error } = await supabase
      .from('website_urls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as WebsiteUrl[];
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
