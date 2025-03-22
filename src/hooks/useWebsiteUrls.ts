import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl } from "@/types/client";
import { toast } from "sonner";

export const useWebsiteUrls = (clientId: string) => {
  const [websiteUrls, setWebsiteUrls] = useState<WebsiteUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsiteUrls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('website_urls')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Add the missing properties to match the WebsiteUrl interface
      const formattedData: WebsiteUrl[] = data.map(item => ({
        ...item,
        last_crawled: item.last_crawled || null,
        status: (item.status as "pending" | "processing" | "completed" | "failed" | null) || null,
        notified_at: item.notified_at || null
      }));
      
      setWebsiteUrls(formattedData);
    } catch (err: any) {
      console.error("Error fetching website URLs:", err);
      setError(err.message || "Failed to fetch website URLs");
    } finally {
      setIsLoading(false);
    }
  };

  const addWebsiteUrl = async (url: string, refreshRate: number | null = null): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('website_urls')
        .insert({
          client_id: clientId,
          url,
          refresh_rate: refreshRate,
          status: "pending"
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Add the missing properties to match the WebsiteUrl interface
      const newUrl: WebsiteUrl = {
        ...data,
        last_crawled: null,
        status: data.status as "pending" | "processing" | "completed" | "failed" | null,
        notified_at: null
      };
      
      setWebsiteUrls(prev => [newUrl, ...prev]);
      return true;
    } catch (err: any) {
      console.error("Error adding website URL:", err);
      toast.error(err.message || "Failed to add website URL");
      return false;
    }
  };

  const deleteWebsiteUrl = async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('website_urls')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setWebsiteUrls(prev => prev.filter(url => url.id !== id));
    } catch (err: any) {
      console.error("Error deleting website URL:", err);
      toast.error(err.message || "Failed to delete website URL");
    }
  };

  const updateWebsiteUrlStatus = async (id: number, status: "pending" | "processing" | "completed" | "failed" | null): Promise<void> => {
    try {
      const { error } = await supabase
        .from('website_urls')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setWebsiteUrls(prev =>
        prev.map(url =>
          url.id === id ? { ...url, status } : url
        )
      );
    } catch (err: any) {
      console.error("Error updating website URL status:", err);
      toast.error(err.message || "Failed to update website URL status");
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchWebsiteUrls();
    }
  }, [clientId]);

  return {
    websiteUrls,
    isLoading,
    error,
    fetchWebsiteUrls,
    addWebsiteUrl,
    deleteWebsiteUrl,
    updateWebsiteUrlStatus,
  };
};
