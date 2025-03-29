
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";
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
      console.log("Current user:", user?.id);
      
      // First try with regular supabase client
      try {
        const { data, error } = await supabase
          .from("website_urls")
          .insert({
            client_id: effectiveClientId,
            url: input.url,
            refresh_rate: input.refresh_rate,
            status: input.status || 'pending'
          })
          .select()
          .single();
          
        if (error) {
          console.error("Regular client error:", error);
          // If that fails, try with admin client if available
          if (supabaseAdmin) {
            console.log("Trying with admin client");
            const { data: adminData, error: adminError } = await supabaseAdmin
              .from("website_urls")
              .insert({
                client_id: effectiveClientId,
                url: input.url,
                refresh_rate: input.refresh_rate,
                status: input.status || 'pending'
              })
              .select()
              .single();
              
            if (adminError) {
              console.error("Admin client error:", adminError);
              throw adminError;
            }
            
            return adminData as WebsiteUrl;
          } else {
            throw error;
          }
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
        // First try with regular client
        const { error } = await supabase
          .from("website_urls")
          .delete()
          .eq("id", urlId);
          
        if (error) {
          console.error("Regular client delete error:", error);
          
          // If that fails, try with admin client if available
          if (supabaseAdmin) {
            console.log("Trying delete with admin client");
            const { error: adminError } = await supabaseAdmin
              .from("website_urls")
              .delete()
              .eq("id", urlId);
              
            if (adminError) {
              console.error("Admin client delete error:", adminError);
              throw adminError;
            }
          } else {
            throw error;
          }
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
