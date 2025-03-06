
import { useQuery } from "@tanstack/react-query";
import { Client } from "@/types/client";
import { getClientById } from "@/services/clientService";

export const useClient = (id: string | undefined) => {
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
    enabled: true, // Always enable the query, even if id is undefined
  });

  return {
    client,
    isLoadingClient,
    error
  };
};
