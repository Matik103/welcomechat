
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrl } from "@/types/client";

type WebsiteUrlResponse = {
  data: WebsiteUrl[] | null;
  error: any;
};

export const useWebsiteUrls = (clientId: string | undefined) => {
  const query = useQuery({
    queryKey: ["websiteUrls", clientId],
    queryFn: async (): Promise<WebsiteUrl[]> => {
      if (!clientId) return [];
      const { data, error }: WebsiteUrlResponse = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const checkWebsiteAccess = async (url: string) => {
    try {
      const { data: existingData } = await supabase
        .from("ai_agent")
        .select("*")
        .eq("metadata->client_id", clientId)
        .eq("metadata->url", url)
        .single();

      if (existingData) {
        await supabase
          .from("ai_agent")
          .delete()
          .eq("metadata->client_id", clientId)
          .eq("metadata->url", url);
      }

      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Lovable/1.0; +https://lovable.dev)"
        }
      });

      if (!response.ok) {
        throw new Error("Website is not publicly accessible");
      }

      await fetch(process.env.N8N_WEBHOOK_URL || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          url,
          type: "website"
        })
      });

      return true;
    } catch (error: any) {
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
    mutationFn: async ({ url, refresh_rate }: { url: string; refresh_rate: number }): Promise<WebsiteUrl> => {
      if (!clientId) throw new Error("Client ID is required");
      
      await checkWebsiteAccess(url);
      
      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          client_id: clientId,
          url,
          refresh_rate
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      query.refetch();
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
      query.refetch();
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
  };
};
