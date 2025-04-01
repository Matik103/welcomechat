
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl, WebsiteUrlFormData } from "@/types/website-url";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useWebsiteUrlsMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (input: WebsiteUrlFormData): Promise<WebsiteUrl> => {
      if (!clientId && !input.client_id) {
        console.error("Client ID is missing");
        throw new Error("Client ID is required");
      }
      
      const effectiveClientId = input.client_id || clientId;
      
      console.log("Adding website URL with client ID:", effectiveClientId);
      console.log("Input data:", input);
      
      // Find the correct client record in ai_agents table
      const { data: clientRecord, error: clientError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("interaction_type", "config")
        .or(`id.eq.${effectiveClientId},client_id.eq.${effectiveClientId}`)
        .single();
          
      if (clientError) {
        console.error("Error finding client:", clientError);
        console.log("Attempting to use the provided clientId directly");
        
        // Insert the website URL with the provided client ID as fallback
        const { data, error } = await supabase
          .from("website_urls")
          .insert({
            client_id: effectiveClientId,
            url: input.url,
            refresh_rate: input.refresh_rate || 30,
            status: 'pending',
            metadata: input.metadata || null
          })
          .select()
          .single();
            
        if (error) {
          console.error("Error inserting website URL:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("Failed to create website URL - no data returned");
        }
        
        return data as WebsiteUrl;
      }
      
      console.log("Found client record:", clientRecord);
      
      // Insert the website URL with the correct client ID
      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          client_id: clientRecord.id,
          url: input.url,
          refresh_rate: input.refresh_rate || 30,
          status: 'pending',
          metadata: input.metadata || null
        })
        .select()
        .single();
          
      if (error) {
        console.error("Error inserting website URL:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create website URL - no data returned");
      }
      
      return data as WebsiteUrl;
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
          
        if (error) {
          console.error("Error deleting website URL:", error);
          throw error;
        }
        
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
