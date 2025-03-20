
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "@/services/authService";

/**
 * Hook to fetch widget settings data
 */
export function useWidgetSettingsData(clientId: string | undefined) {
  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      console.log("Fetching client data for ID:", clientId);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (error) {
        console.error("Error fetching client:", error);
        throw error;
      }
      
      console.log("Client data fetched:", data);
      return data;
    },
    enabled: !!clientId,
    staleTime: 0,
    retry: 1
  });

  return {
    client,
    isLoading,
    refetchClient: refetch
  };
}
