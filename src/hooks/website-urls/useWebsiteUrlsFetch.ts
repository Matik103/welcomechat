
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl } from "@/types/website-url";

export function useWebsiteUrlsFetch(clientId: string | undefined) {
  const fetchWebsiteUrls = async (): Promise<WebsiteUrl[]> => {
    if (!clientId) {
      console.warn("No client ID provided to useWebsiteUrlsFetch");
      return [];
    }

    console.log("Fetching website URLs for client:", clientId);

    // First try to find direct matches
    const { data: directMatches, error: directError } = await supabase
      .from("website_urls")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (directError) {
      console.error("Error fetching website URLs directly:", directError);
      throw directError;
    }

    console.log("Direct URL matches:", directMatches);

    // If we found direct matches, return those
    if (directMatches && directMatches.length > 0) {
      return directMatches as WebsiteUrl[];
    }

    // If no direct matches, try to find the client in ai_agents
    console.log("No direct matches, looking up client in ai_agents");
    const { data: clientData, error: clientError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("interaction_type", "config")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .single();

    if (clientError) {
      console.error("Error finding client:", clientError);
      // If we can't find the client, just return an empty array
      return [];
    }

    if (!clientData) {
      console.log("No client data found");
      return [];
    }

    console.log("Found client:", clientData);

    // Now look for website URLs using the client's ID
    const { data: urlsByClientId, error: urlsError } = await supabase
      .from("website_urls")
      .select("*")
      .eq("client_id", clientData.id)
      .order("created_at", { ascending: false });

    if (urlsError) {
      console.error("Error fetching website URLs by client ID:", urlsError);
      throw urlsError;
    }

    console.log("URLs found by client ID:", urlsByClientId);

    return (urlsByClientId || []) as WebsiteUrl[];
  };

  const query = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: fetchWebsiteUrls,
    enabled: !!clientId
  });

  return {
    websiteUrls: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchWebsiteUrls: query.refetch,
  };
}
