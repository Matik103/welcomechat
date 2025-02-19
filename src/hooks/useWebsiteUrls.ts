
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

export const useWebsiteUrls = (clientId: string | undefined) => {
  const { data: websiteUrls = [], refetch: refetchWebsiteUrls } = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async ({ url, refresh_rate }: { url: string; refresh_rate: number }) => {
      if (!clientId) throw new Error("Client ID is required");
      
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
      return data;
    },
    onSuccess: () => {
      refetchWebsiteUrls();
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
    },
    onSuccess: () => {
      refetchWebsiteUrls();
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error removing website URL: ${error.message}`);
    }
  });

  return {
    websiteUrls,
    refetchWebsiteUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
  };
};
