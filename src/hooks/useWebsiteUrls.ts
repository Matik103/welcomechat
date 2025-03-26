
import { useWebsiteUrlsFetch } from "./website-urls/useWebsiteUrlsFetch";
import { useWebsiteUrlsMutation } from "./website-urls/useWebsiteUrlsMutation";
import { useWebsiteUrlsProcessing } from "./website-urls/useWebsiteUrlsProcessing";
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
  
  const {
    validateUrl,
    validateUrlError,
    isValidatingUrl,
    processWebsiteUrl,
    isProcessingUrl,
    processingUrlId,
    isDeletingUrl,
    deletingUrlId,
    setIsDeletingUrl,
    setDeletingUrlId
  } = useWebsiteUrlsProcessing(clientId);

  // Wrapper for deleteWebsiteUrl that sets UI state
  const deleteWebsiteUrlWithUI = async (urlId: number): Promise<void> => {
    setIsDeletingUrl(true);
    setDeletingUrlId(urlId);
    try {
      await deleteWebsiteUrl(urlId);
    } finally {
      setIsDeletingUrl(false);
      setDeletingUrlId(null);
    }
  };

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
    deleteWebsiteUrl: deleteWebsiteUrlWithUI,
    
    // Processing related
    validateUrl,
    validateUrlError,
    isValidatingUrl,
    processWebsiteUrl,
    isProcessingUrl,
    processingUrlId,
    isDeletingUrl,
    deletingUrlId
  };
}
