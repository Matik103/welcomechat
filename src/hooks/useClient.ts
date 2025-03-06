
import { useQuery } from "@tanstack/react-query";
import { Client } from "@/types/client";
import { getClientById } from "@/services/clientService";

export const useClient = (id: string | undefined, enabled = true) => {
  const { 
    data: client, 
    isLoading: isLoadingClient, 
    error 
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) {
        console.log("useClient: No client ID provided, returning null");
        return null;
      }
      
      console.log("useClient: Fetching client data for ID:", id);
      try {
        const result = await getClientById(id);
        console.log("useClient: Fetched client data:", result);
        return result;
      } catch (err) {
        console.error("useClient: Error fetching client:", err);
        throw err;
      }
    },
    enabled: !!id && enabled, // Only run query when we have an ID and explicitly enabled
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
    retry: 1, // Only retry once if there's an error
    refetchOnWindowFocus: false, // Prevent refetching on window focus to reduce flickering
  });

  return {
    client,
    isLoadingClient,
    error
  };
};
