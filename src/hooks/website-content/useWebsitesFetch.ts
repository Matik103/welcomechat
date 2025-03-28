
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Website {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  status?: string;
  created_at: string;
  last_crawled?: string | null;
  scrapable?: boolean;
  scrapability?: 'high' | 'medium' | 'low' | 'unknown';
  lastFetched?: string | null;
  name?: string;
  error?: string;
  updated_at?: string;
  is_sitemap?: boolean;
}

export function useWebsitesFetch(clientId: string | undefined) {
  const {
    data: websites,
    isLoading,
    error,
    refetch: refetchWebsites
  } = useQuery({
    queryKey: ["websites", clientId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from("website_urls")
          .select("*")
          .eq("client_id", clientId);
          
        if (error) {
          console.error("Error fetching websites:", error);
          throw error;
        }
        
        // Map the website_urls data to our Website interface
        return (data || []).map((item: any) => ({
          id: item.id,
          client_id: item.client_id,
          url: item.url,
          refresh_rate: item.refresh_rate,
          status: item.status,
          created_at: item.created_at,
          last_crawled: item.last_crawled,
          scrapable: item.scrapable,
          scrapability: item.scrapability,
          lastFetched: item.last_crawled, // Map to the same field
          error: item.error,
          updated_at: item.updated_at,
          is_sitemap: item.is_sitemap
        } as Website));
      } catch (error) {
        console.error("Error in websitesFetch:", error);
        throw error;
      }
    },
    enabled: !!clientId,
  });

  return {
    websites: websites || [],
    isLoading,
    error,
    refetchWebsites
  };
}
