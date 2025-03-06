
import { useQuery } from "@tanstack/react-query";
import { Client } from "@/types/client";
import { getClientById } from "@/services/clientService";

export const useClient = (id: string | undefined) => {
  const { 
    data: client, 
    isLoading: isLoadingClient, 
    error,
    isError
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) {
        console.log("useClient: No client ID provided");
        return null;
      }
      console.log("useClient: Fetching client with ID:", id);
      return getClientById(id);
    },
    enabled: !!id, // Only run the query if id is defined
    retry: 1,
  });

  return {
    client,
    isLoadingClient,
    error: isError ? error : null,
  };
};
