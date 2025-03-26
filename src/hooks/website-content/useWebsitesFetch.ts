
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "@/services/authService";

interface Website {
  id: number;
  client_id: string;
  url: string;
  scrapable: boolean;
  refresh_rate: number;
  lastFetched?: string;
  created_at?: string;
  name?: string;
}

/**
 * Hook to fetch website URLs for a client
 */
export function useWebsitesFetch(clientId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch websites
  const { data: websites, isLoading: isWebsitesLoading, error, refetch } = useQuery({
    queryKey: ["websites", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log(`Fetching websites for client: ${clientId}`);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("website_urls")
          .select("*")
          .eq("client_id", clientId);
        
        if (error) {
          console.error("Error fetching website urls:", error);
          throw error;
        }
        
        console.log("Client websites fetched:", data);
        // Add name property to each website for compatibility
        return (data || []).map(site => ({
          ...site,
          scrapable: true, // Add default scrapable property
          name: `Website ${site.id}` // Default name based on ID if none provided
        })) as Website[];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!clientId,
  });

  return {
    websites,
    isLoading: isLoading || isWebsitesLoading,
    error,
    refetchWebsites: refetch,
  };
}

export type { Website };
