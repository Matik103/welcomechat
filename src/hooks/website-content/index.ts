
import { useEffect } from "react";
import { useWebsitesFetch, Website } from "./useWebsitesFetch";
import { useWebsitesMutation } from "./useWebsitesMutation";
import { useWebsiteContentStorage } from "./useWebsiteContentStorage";
import { toast } from "sonner";

/**
 * Combined hook for all website content operations
 */
export function useStoreWebsiteContent(clientId: string | undefined) {
  const { websites, isLoading, error, refetchWebsites } = useWebsitesFetch(clientId);
  const { addWebsite, deleteWebsite, updateWebsite } = useWebsitesMutation(clientId);
  const { storeWebsiteContent: storeContent, isStoring } = useWebsiteContentStorage();

  // Wrapper for storeWebsiteContent that includes clientId
  const storeWebsiteContent = async (website: Website) => {
    if (!clientId) {
      return { success: false, error: "Client ID is missing" };
    }
    return storeContent(website, clientId);
  };

  // Handle error
  useEffect(() => {
    if (error) {
      console.error("Error in useStoreWebsiteContent:", error);
      toast.error("Failed to load websites");
    }
  }, [error]);

  return {
    websites,
    isLoading,
    isStoring,
    error,
    refetchWebsites,
    addWebsite,
    deleteWebsite,
    updateWebsite,
    storeWebsiteContent,
  };
}

export type { Website };
