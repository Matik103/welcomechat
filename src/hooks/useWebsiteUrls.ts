
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

  const checkWebsiteAccess = async (url: string) => {
    try {
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

      // Attempt to fetch the website
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Lovable/1.0; +https://lovable.dev)"
        }
      });

      if (!response.ok) {
        throw new Error("Website is not publicly accessible");
      }

      // Trigger n8n webhook for processing
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
      // Log error to error_logs table
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
      console.error("Error details:", error);
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
