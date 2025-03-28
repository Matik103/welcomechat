
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl, WebsiteUrlFormData } from "@/types/website-url";
import { toast } from "sonner";

export function useWebsiteUrlsMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();

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
            status: input.status || 'pending'
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
      try {
        const { error } = await supabase
          .from("website_urls")
          .delete()
          .eq("id", urlId);
        if (error) throw error;
        return urlId;
      } catch (error) {
        console.error("Error deleting website URL:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error removing website URL: ${error.message}`);
    }
  });

  return {
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    addWebsiteUrl: addWebsiteUrlMutation.mutateAsync,
    deleteWebsiteUrl: deleteWebsiteUrlMutation.mutateAsync,
  };
}
