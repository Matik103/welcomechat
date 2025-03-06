
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

export const useWebsiteUrls = (clientId: string | undefined) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", clientId);
      if (error) {
        console.error("Error fetching website URLs:", error);
        throw error;
      }
      return data as WebsiteUrl[];
    },
    enabled: !!clientId,
  });

  const checkWebsiteAccess = async (url: string) => {
    try {
      // Make sure the URL is properly formatted
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Check if the URL exists in the AI agent table
      const { data: existingData } = await supabase
        .from("ai_agent")
        .select("id")
        .eq("metadata->>client_id", clientId)
        .eq("metadata->>url", url)
        .maybeSingle();

      if (existingData) {
        // Delete the old content
        await supabase
          .from("ai_agent")
          .delete()
          .eq("id", existingData.id);
      }

      return true;
    } catch (error: any) {
      // Log error to database
      await supabase.from("error_logs").insert({
        client_id: clientId,
        error_type: "website_access",
        message: error.message,
        status: "error"
      });
      
      throw error;
    }
  };

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async ({ url, refresh_rate }: { url: string; refresh_rate: number }) => {
      if (!clientId) throw new Error("Client ID is required");
      
      // Make sure the URL is properly formatted
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Validate website accessibility
      await checkWebsiteAccess(url);
      
      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          client_id: clientId,
          url,
          refresh_rate
        })
        .select('id, url, refresh_rate')
        .single();
      
      if (error) throw error;
      return data as WebsiteUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      console.error("Error details:", error);
      toast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (urlId: number) => {
      const { error } = await supabase
        .from("website_urls")
        .delete()
        .eq("id", urlId);
      if (error) throw error;
      return urlId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      console.error("Error details:", error);
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
};
