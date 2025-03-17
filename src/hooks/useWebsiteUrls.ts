import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

export function useWebsiteUrls(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
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

  const validateUrl = async (url: string): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);
    try {
      // Validate URL format
      const urlObj = new URL(url);
      
      // Determine URL type
      const type = urlObj.hostname.includes('drive.google.com') ? 'google_drive' : 'website';

      // Get the current session
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Call the validate-urls function
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-urls', {
        body: { url, type },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (validationError) throw validationError;

      if (!validationResult.isAccessible) {
        // Show warning but still allow adding the URL
        toast.warning(
          `The ${type === 'google_drive' ? 'Google Drive file' : 'website'} might have accessibility issues: ${validationResult.error || 'Unknown error'}. 
          ${type === 'website' && validationResult.details?.robotsTxtAllows === false ? 'The website\'s robots.txt disallows crawling.' : ''}
          ${type === 'website' && validationResult.details?.isSecure === false ? 'The website is not using HTTPS.' : ''}
          Please ensure the ${type === 'google_drive' ? 'file is properly shared and accessible' : 'website is properly configured for crawling'}.`
        );
      }

      return true;
    } catch (error) {
      console.error("Error validating URL:", error);
      setValidationError(error instanceof Error ? error.message : "An error occurred");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const addWebsiteUrl = async (input: { url: string; refresh_rate: number }): Promise<WebsiteUrl> => {
    if (!clientId) {
      console.error("Client ID is missing");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding website URL with client ID:", clientId);
    console.log("Input data:", input);

    // Validate URL first
    const isValid = await validateUrl(input.url);
    if (!isValid) {
      throw new Error(validationError || "URL validation failed");
    }
    
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
  };

  const deleteWebsiteUrl = async (urlId: number): Promise<number> => {
    const { error } = await supabase
      .from("website_urls")
      .delete()
      .eq("id", urlId);
    if (error) throw error;
    return urlId;
  };

  const addWebsiteUrlMutation = useMutation({
    mutationFn: addWebsiteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: deleteWebsiteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error removing website URL: ${error.message}`);
    }
  });

  return {
    websiteUrls: query.data || [],
    refetchWebsiteUrls: query.refetch,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    isLoading: query.isLoading || isValidating,
    isError: query.isError,
    validationError
  };
}
