
import { useWebsiteUrlsFetch } from "./website-urls/useWebsiteUrlsFetch";
import { useWebsiteUrlsMutation } from "./website-urls/useWebsiteUrlsMutation";
import { WebsiteUrlFormData } from "@/types/website-url";

export function useWebsiteUrls(clientId: string | undefined) {
  // Use specialized hooks
  const { 
    websiteUrls, 
    isLoading, 
    isError, 
    refetchWebsiteUrls 
  } = useWebsiteUrlsFetch(clientId);
  
  const { 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    addWebsiteUrl, 
    deleteWebsiteUrl 
  } = useWebsiteUrlsMutation(clientId);

  return {
    // Fetch related
    websiteUrls,
    refetchWebsiteUrls,
    isLoading,
    isError,
    
    // Mutation related
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    addWebsiteUrl,
    deleteWebsiteUrl
  };
}
