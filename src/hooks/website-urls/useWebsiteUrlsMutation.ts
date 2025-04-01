
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl } from "@/types/website-url";
import { useAuth } from "@/contexts/AuthContext";

interface AddWebsiteUrlParams {
  url: string;
  refresh_rate: number;
}

export function useWebsiteUrlsMutation(clientId: string) {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  // Delete website URL mutation
  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (websiteUrlId: number) => {
      if (!clientId) {
        throw new Error("Client ID is required to delete a website URL");
      }

      console.log(`Deleting website URL with ID ${websiteUrlId} for client ${clientId}`);

      const { error } = await supabase
        .from("website_urls")
        .delete()
        .eq("id", websiteUrlId)
        .eq("client_id", clientId);

      if (error) {
        console.error("Error deleting website URL:", error);
        throw error;
      }

      return websiteUrlId;
    },
    onSuccess: () => {
      // Invalidate the website URLs query cache
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting website URL:", error);
      toast.error(`Failed to delete website URL: ${error instanceof Error ? error.message : String(error)}`);
    },
  });

  // Add website URL mutation
  const addWebsiteUrlMutation = useMutation({
    mutationFn: async ({ url, refresh_rate }: AddWebsiteUrlParams) => {
      if (!clientId) {
        throw new Error("Client ID is required to add a website URL");
      }

      console.log(`Adding website URL ${url} for client ${clientId}`);

      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          url,
          refresh_rate,
          client_id: clientId,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding website URL:", error);
        throw error;
      }

      return data as WebsiteUrl;
    },
    onSuccess: () => {
      // Invalidate the website URLs query cache
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error) => {
      console.error("Error adding website URL:", error);
      toast.error(`Failed to add website URL: ${error instanceof Error ? error.message : String(error)}`);
    },
  });

  // Return the mutation functions and their states
  return {
    // Delete website URL
    deleteWebsiteUrl: deleteWebsiteUrlMutation.mutateAsync,
    deleteWebsiteUrlMutation,

    // Add website URL
    addWebsiteUrl: addWebsiteUrlMutation.mutateAsync,
    addWebsiteUrlMutation,
  };
}
