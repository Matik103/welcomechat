
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
      
      // Ensure all properties match the WebsiteUrl interface
      const formattedData: WebsiteUrl[] = data.map(item => ({
        id: item.id,
        client_id: item.client_id,
        url: item.url,
        created_at: item.created_at,
        last_crawled: null, // Default value if not present in DB
        refresh_rate: item.refresh_rate || null,
        status: item.status || null,
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
          refresh_rate: refreshRate || 30,
          status: "pending"
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format the new URL to match the WebsiteUrl interface
      const newUrl: WebsiteUrl = {
        id: data.id,
        client_id: data.client_id,
        url: data.url,
        created_at: data.created_at,
        last_crawled: null, // Default value
        refresh_rate: data.refresh_rate || null,
        status: data.status || null,
        notified_at: data.notified_at || null
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

  const updateWebsiteUrlStatus = async (id: number, status: WebsiteUrl['status']): Promise<void> => {
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
