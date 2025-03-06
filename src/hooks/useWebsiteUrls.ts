
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

export function useWebsiteUrls(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: async () => {
      if (!clientId) {
        console.log("No client ID provided for websiteUrls query, returning empty array");
        return [];
      }
      
      console.log("Fetching website URLs for client:", clientId);
      try {
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
      } catch (error) {
        console.error("Exception in websiteUrls query:", error);
        throw error;
      }
    },
    enabled: !!clientId,
  });

  const addWebsiteUrl = async (input: { url: string; refresh_rate: number; client_id?: string }): Promise<WebsiteUrl> => {
    // Ensure we have a client ID, either from the input or the hook parameter
    const effectiveClientId = input.client_id || clientId;
    
    if (!effectiveClientId) {
      console.error("Client ID is missing");
      toast.error("Unable to add URL: Client ID is missing. Please refresh the page or contact support.");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding website URL with client ID:", effectiveClientId);
    console.log("Input data:", input);
    
    // Insert the website URL
    try {
      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          client_id: effectiveClientId,
          url: input.url,
          refresh_rate: input.refresh_rate,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error adding URL:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create website URL - no data returned");
      }
      
      console.log("Successfully added website URL:", data);
      return data as WebsiteUrl;
    } catch (insertError) {
      console.error("Error inserting website URL:", insertError);
      throw insertError;
    }
  };

  const deleteWebsiteUrl = async (urlId: number): Promise<number> => {
    console.log("Deleting website URL with ID:", urlId);
    try {
      const { error } = await supabase
        .from("website_urls")
        .delete()
        .eq("id", urlId);
        
      if (error) {
        console.error("Error deleting website URL:", error);
        throw error;
      }
      
      console.log("Successfully deleted website URL:", urlId);
      return urlId;
    } catch (deleteError) {
      console.error("Exception in deleteWebsiteUrl:", deleteError);
      throw deleteError;
    }
  };

  const addWebsiteUrlMutation = useMutation({
    mutationFn: addWebsiteUrl,
    onSuccess: () => {
      console.log("Website URL added successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      console.error("Website URL mutation error:", error);
      toast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: deleteWebsiteUrl,
    onSuccess: () => {
      console.log("Website URL deleted successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      console.error("Website URL deletion error:", error);
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
