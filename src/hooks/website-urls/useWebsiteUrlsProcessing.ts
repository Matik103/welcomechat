
import { useState } from "react";
import { WebsiteUrl } from "@/types/website-url";
import { toast } from "sonner";

export function useWebsiteUrlsProcessing(clientId: string | undefined) {
  const [validateUrlError, setValidateUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [processingUrlId, setProcessingUrlId] = useState<number | null>(null);
  const [isDeletingUrl, setIsDeletingUrl] = useState(false);
  const [deletingUrlId, setDeletingUrlId] = useState<number | null>(null);

  // Validate URL function
  const validateUrl = async (url: string): Promise<boolean> => {
    setIsValidatingUrl(true);
    setValidateUrlError(null);
    
    try {
      // Basic URL validation
      let urlToCheck = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToCheck = `https://${url}`;
      }
      
      // Check if URL is valid format
      try {
        new URL(urlToCheck);
      } catch (e) {
        setValidateUrlError("Invalid URL format");
        return false;
      }
      
      // More advanced validation could be added here, e.g. checking if site is accessible
      return true;
    } catch (error) {
      setValidateUrlError(error instanceof Error ? error.message : "Failed to validate URL");
      return false;
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Process website URL
  const processWebsiteUrl = async (url: WebsiteUrl): Promise<void> => {
    if (!clientId) return;
    
    setIsProcessingUrl(true);
    setProcessingUrlId(url.id);
    
    try {
      // Here you would call your processing function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawl-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          websiteId: url.id,
          clientId: clientId,
          url: url.url
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process website');
      }
      
      toast.success("Website processed successfully");
    } catch (error) {
      toast.error(`Error processing website: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingUrl(false);
      setProcessingUrlId(null);
    }
  };

  return {
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
  };
}
