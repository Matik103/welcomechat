
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl } from "@/types/website-url";

export function useWebsiteUrlsFetch(clientId: string | undefined) {
  // Fetch website URLs for a client
  const {
    data: websiteUrls,
    isLoading,
    isError,
    refetch: refetchWebsiteUrls
  } = useQuery({
    queryKey: ["websiteUrls", clientId],
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
          console.error("Error fetching website URLs:", error);
          throw error;
        }
        
        return data as WebsiteUrl[];
      } catch (error) {
        console.error("Error in websiteUrlsFetch:", error);
        throw error;
      }
    },
    enabled: !!clientId,
  });

  return {
    websiteUrls: websiteUrls || [],
    isLoading,
    isError,
    refetchWebsiteUrls
  };
}
