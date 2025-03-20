
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

interface Website {
  id: number;
  client_id: string;
  url: string;
  scrapable: boolean;
  lastFetched?: string;
  created_at?: string;
  name?: string; // Add name property that was missing
}

export function useStoreWebsiteContent(clientId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStoring, setIsStoring] = useState(false); // Added missing isStoring state
  const queryClient = useQueryClient();

  // Fetch websites
  const { data: websites, isLoading: isWebsitesLoading, error, refetch } = useQuery({
    queryKey: ["websites", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log(`Fetching websites for client: ${clientId}`);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("website_urls") // Fix: Use website_urls instead of client_websites
          .select("*")
          .eq("client_id", clientId);
        
        if (error) {
          console.error("Error fetching website urls:", error);
          throw error;
        }
        
        console.log("Client websites fetched:", data);
        // Add name property to each website for compatibility
        return (data || []).map(site => ({
          ...site,
          name: `Website ${site.id}` // Default name based on ID if none provided
        })) as Website[];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!clientId,
  });

  // Mutation to add a new website
  const addWebsiteMutation = useMutation({
    mutationFn: async (newWebsite: Omit<Website, 'id' | 'created_at' | 'lastFetched'>) => {
      console.log("Adding new website:", newWebsite);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const { data, error } = await supabase
        .from("website_urls") // Fix: Use website_urls instead of client_websites
        .insert([newWebsite])
        .select();
      
      if (error) {
        console.error("Error adding website:", error);
        throw error;
      }
      
      console.log("Website added:", data);
      return data;
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
        .from("website_urls") // Fix: Use website_urls instead of client_websites
        .delete()
        .eq("id", websiteId);
      
      if (error) {
        console.error("Error deleting website:", error);
        throw error;
      }
      
      console.log("Website deleted successfully");
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
        .from("website_urls") // Fix: Use website_urls instead of client_websites
        .update(updatedWebsite)
        .eq("id", updatedWebsite.id);
      
      if (error) {
        console.error("Error updating website:", error);
        throw error;
      }
      
      console.log("Website updated successfully");
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

  // Function to store website content
  const storeWebsiteContent = async (website: Website) => {
    if (!clientId) {
      console.warn("Client ID is missing, cannot store website content.");
      return { success: false, error: "Client ID is missing" };
    }
    
    console.log(`Storing website content for client: ${clientId}, website: ${website.url}`);
    
    // Ensure we have a valid auth session
    await checkAndRefreshAuth();
    
    setIsStoring(true);
    
    try {
      // Create a JSON object with website details
      const websiteJson = {
        id: String(website.id), // Convert to string here
        name: website.name || `Website ${website.id}`,
        url: website.url,
        scrapable: website.scrapable,
        lastFetched: website.lastFetched
      };
      
      // Insert the website content into the ai_agents table
      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: website.name || `Website ${website.id}`,
          content: JSON.stringify(websiteJson),
          url: website.url,
          interaction_type: "website_content",
          settings: websiteJson,
          is_error: false
        });
      
      if (agentError) {
        console.error("Error storing website content in ai_agents:", agentError);
        return { success: false, error: agentError.message };
      }
      
      console.log("Website content stored successfully in ai_agents");
      toast.success("Website content stored successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error in storeWebsiteContent:", error);
      toast.error(`Failed to store website content: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsStoring(false);
    }
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
    isLoading: isLoading || isWebsitesLoading,
    isStoring, // Add the isStoring property
    error,
    refetchWebsites: refetch,
    addWebsite: addWebsiteMutation.mutateAsync,
    deleteWebsite: deleteWebsiteMutation.mutateAsync,
    updateWebsite: updateWebsiteMutation.mutateAsync,
    storeWebsiteContent,
  };
}
