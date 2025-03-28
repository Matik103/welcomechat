
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";
import { Website } from "./useWebsitesFetch";

/**
 * Hook for website mutation operations (add, update, delete)
 */
export function useWebsitesMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();

  // Mutation to add a new website
  const addWebsiteMutation = useMutation({
    mutationFn: async (newWebsite: Omit<Website, 'id' | 'created_at' | 'lastFetched'>) => {
      console.log("Adding new website:", newWebsite);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      // Make sure client_id is set
      const websiteData = {
        client_id: clientId || '',
        url: newWebsite.url,
        refresh_rate: newWebsite.refresh_rate,
        // Add any other fields from newWebsite that should be saved
      };
      
      const { data, error } = await supabase
        .from("website_urls")
        .insert(websiteData)
        .select();
      
      if (error) {
        console.error("Error adding website:", error);
        throw error;
      }
      
      console.log("Website added:", data);
      return data[0] as Website;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["websites", clientId] });
      toast.success("Website added successfully");
    },
    onError: (error: any) => {
      console.error("Error in addWebsiteMutation:", error);
      toast.error(`Failed to add website: ${error.message}`);
    },
  });

  // Mutation to delete a website
  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      console.log("Deleting website with ID:", websiteId);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const { error } = await supabase
        .from("website_urls")
        .delete()
        .eq("id", websiteId);
      
      if (error) {
        console.error("Error deleting website:", error);
        throw error;
      }
      
      console.log("Website deleted successfully");
      return websiteId;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["websites", clientId] });
      toast.success("Website deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error in deleteWebsiteMutation:", error);
      toast.error(`Failed to delete website: ${error.message}`);
    },
  });

  // Mutation to update a website
  const updateWebsiteMutation = useMutation({
    mutationFn: async (updatedWebsite: Website) => {
      console.log("Updating website:", updatedWebsite);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const { error } = await supabase
        .from("website_urls")
        .update({
          url: updatedWebsite.url,
          refresh_rate: updatedWebsite.refresh_rate,
          status: updatedWebsite.status,
          // Add any other fields that should be updated
        })
        .eq("id", updatedWebsite.id);
      
      if (error) {
        console.error("Error updating website:", error);
        throw error;
      }
      
      console.log("Website updated successfully");
      return updatedWebsite;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["websites", clientId] });
      toast.success("Website updated successfully");
    },
    onError: (error: any) => {
      console.error("Error in updateWebsiteMutation:", error);
      toast.error(`Failed to update website: ${error.message}`);
    },
  });

  return {
    addWebsite: addWebsiteMutation.mutateAsync,
    deleteWebsite: deleteWebsiteMutation.mutateAsync,
    updateWebsite: updateWebsiteMutation.mutateAsync,
  };
}
