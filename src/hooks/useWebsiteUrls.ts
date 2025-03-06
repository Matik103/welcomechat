
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

export function useWebsiteUrls(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  console.log("useWebsiteUrls hook called with clientId:", clientId);
  
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

  const addWebsiteUrl = async (input: { url: string; refresh_rate: number }): Promise<WebsiteUrl> => {
    if (!clientId) {
      console.error("Client ID is missing");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding website URL with client ID:", clientId);
    console.log("Input data:", input);
    
    // No check for duplicate URLs - allow duplicates
    
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
    isLoading: query.isLoading,
    isError: query.isError
  };
}
