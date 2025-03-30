
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl } from "@/types/website-url";
import { useState, useCallback } from "react";

export function useWebsiteUrlsFetch(clientId: string | undefined) {
  const [error, setError] = useState<Error | null>(null);

  // Create a memoized refetch function
  const fetchWebsiteUrls = useCallback(async () => {
    if (!clientId) {
      console.warn("No client ID provided to useWebsiteUrlsFetch");
      return [];
    }
    
    try {
      console.log("Fetching website URLs for client:", clientId);
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching website URLs:", error);
        setError(error);
        throw error;
      }
      
      console.log("Retrieved website URLs:", data);
      return data as WebsiteUrl[];
    } catch (error) {
      console.error("Error in websiteUrlsFetch:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [clientId]);

  // Fetch website URLs for a client
  const {
    data: websiteUrls,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: fetchWebsiteUrls,
    enabled: !!clientId,
    staleTime: 1000 * 60, // 1 minute
  });

  const refetchWebsiteUrls = useCallback(async () => {
    if (clientId) {
      console.log("Manually refetching website URLs for client:", clientId);
      return refetch();
    }
    return null;
  }, [clientId, refetch]);

  return {
    websiteUrls: websiteUrls || [],
    isLoading,
    isError,
    error,
    refetchWebsiteUrls
  };
}
