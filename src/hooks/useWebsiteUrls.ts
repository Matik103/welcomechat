
import { useWebsiteUrlsFetch } from './website-urls/useWebsiteUrlsFetch';
import { useWebsiteUrlsMutation } from './website-urls/useWebsiteUrlsMutation';

export function useWebsiteUrls(clientId: string | undefined) {
  const {
    websiteUrls,
    isLoading,
    isError,
    refetchWebsiteUrls
  } = useWebsiteUrlsFetch(clientId);
  
  const {
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation
  } = useWebsiteUrlsMutation(clientId);
  
  return {
    websiteUrls,
    isLoading,
    isError,
    refetchWebsiteUrls,
    addWebsiteUrl: addWebsiteUrlMutation.mutateAsync,
    deleteWebsiteUrl: deleteWebsiteUrlMutation.mutateAsync,
    isAdding: addWebsiteUrlMutation.isPending,
    isDeleting: deleteWebsiteUrlMutation.isPending,
    addError: addWebsiteUrlMutation.error,
    deleteError: deleteWebsiteUrlMutation.error
  };
}
