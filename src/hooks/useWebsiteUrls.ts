
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl, WebsiteUrlFormData } from "@/types/website-url";
import { useState } from "react";

export function useWebsiteUrls(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [validateUrlError, setValidateUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [processingUrlId, setProcessingUrlId] = useState<number | null>(null);
  const [isDeletingUrl, setIsDeletingUrl] = useState(false);
  const [deletingUrlId, setDeletingUrlId] = useState<number | null>(null);
  
  const query = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log("Fetching website URLs for client:", clientId);
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching website URLs:", error);
        throw error;
      }
      
      console.log("Fetched website URLs:", data);
      return data as WebsiteUrl[];
    },
    enabled: !!clientId,
  });

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (input: WebsiteUrlFormData): Promise<WebsiteUrl> => {
      if (!clientId) {
        console.error("Client ID is missing");
        throw new Error("Client ID is required");
      }
      
      console.log("Adding website URL with client ID:", clientId);
      console.log("Input data:", input);
      
      // Insert the website URL
      try {
        const { data, error } = await supabase
          .from("website_urls")
          .insert({
            client_id: clientId,
            url: input.url,
            refresh_rate: input.refresh_rate,
          })
          .select()
          .single();
          
        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("Failed to create website URL - no data returned");
        }
        
        return data as WebsiteUrl;
      } catch (insertError) {
        console.error("Error inserting website URL:", insertError);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (urlId: number): Promise<number> => {
      setIsDeletingUrl(true);
      setDeletingUrlId(urlId);
      try {
        const { error } = await supabase
          .from("website_urls")
          .delete()
          .eq("id", urlId);
        if (error) throw error;
        return urlId;
      } finally {
        setIsDeletingUrl(false);
        setDeletingUrlId(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      setIsDeletingUrl(false);
      setDeletingUrlId(null);
      toast.error(`Error removing website URL: ${error.message}`);
    }
  });

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
      
      await query.refetch();
      toast.success("Website processed successfully");
    } catch (error) {
      toast.error(`Error processing website: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingUrl(false);
      setProcessingUrlId(null);
    }
  };

  const addWebsiteUrl = async (data: WebsiteUrlFormData): Promise<void> => {
    await addWebsiteUrlMutation.mutateAsync(data);
  };

  const deleteWebsiteUrl = async (urlId: number): Promise<void> => {
    await deleteWebsiteUrlMutation.mutateAsync(urlId);
  };

  return {
    websiteUrls: query.data || [],
    refetchWebsiteUrls: query.refetch,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    isLoading: query.isLoading,
    isError: query.isError,
    addWebsiteUrl,
    deleteWebsiteUrl,
    processWebsiteUrl,
    validateUrl,
    validateUrlError,
    isValidatingUrl,
    isProcessingUrl,
    processingUrlId,
    isDeletingUrl,
    deletingUrlId
  };
}
