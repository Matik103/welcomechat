
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";
import { Website } from "./useWebsitesFetch";

/**
 * Hook for storing website content in the AI agents table
 */
export function useWebsiteContentStorage() {
  const [isStoring, setIsStoring] = useState(false);

  // Mutation for storing website content
  const storeContentMutation = useMutation({
    mutationFn: async ({ website, clientId }: { website: Website, clientId: string }) => {
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
          id: String(website.id), 
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
        return { success: true };
      } catch (error: any) {
        console.error("Error in storeWebsiteContent:", error);
        return { success: false, error: error.message };
      } finally {
        setIsStoring(false);
      }
    },
    onSuccess: () => {
      toast.success("Website content stored successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to store website content: ${error.message}`);
    }
  });

  // Function to store website content
  const storeWebsiteContent = async (website: Website, clientId: string) => {
    return await storeContentMutation.mutateAsync({ website, clientId });
  };

  return {
    storeWebsiteContent,
    isStoring,
  };
}
