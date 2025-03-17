import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { WebsiteUrl } from "@/types/client";
import { useToast } from '@/components/ui/use-toast';

export function useWebsiteUrls(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  const fetchUrls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('website_urls')
        .select('url')
        .eq('client_id', clientId);

      if (error) throw error;
      setUrls(data.map(item => item.url));
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error fetching URLs",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate URL format
      new URL(url);

      // Call the validate-urls function
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-urls', {
        body: { url, type: 'website' }
      });

      if (validationError) throw validationError;

      if (!validationResult.isAccessible) {
        // Show warning but still allow adding the URL
        toast({
          title: "Website Accessibility Warning",
          description: `The website might have accessibility issues: ${validationResult.error || 'Unknown error'}. 
            ${validationResult.details?.robotsTxtAllows === false ? 'The website\'s robots.txt disallows crawling.' : ''}
            ${validationResult.details?.isSecure === false ? 'The website is not using HTTPS.' : ''}
            Please ensure the website is properly configured for crawling.`,
          variant: "default"
        });
      }

      const { error: insertError } = await supabase
        .from('website_urls')
        .insert([{ client_id: clientId, url }]);

      if (insertError) throw insertError;

      setUrls([...urls, url]);
      toast({
        title: "URL Added",
        description: "The website URL has been added successfully.",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error adding URL",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('website_urls')
        .delete()
        .eq('client_id', clientId)
        .eq('url', url);

      if (error) throw error;

      setUrls(urls.filter(u => u !== url));
      toast({
        title: "URL Deleted",
        description: "The website URL has been removed successfully.",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error deleting URL",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWebsiteUrlMutation = useMutation({
    mutationFn: addUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      sonnerToast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      sonnerToast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      sonnerToast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      sonnerToast.error(`Error removing website URL: ${error.message}`);
    }
  });

  return {
    urls,
    isLoading,
    error,
    fetchUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    websiteUrls: query.data || [],
    refetchWebsiteUrls: query.refetch,
    isError: query.isError
  };
}
