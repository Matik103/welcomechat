
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
      // If ID is undefined, we'll return null but not throw an error
      if (!id) return null;
      console.log("Fetching client data for ID:", id);
      return getClientById(id);
    },
    enabled: !!id, // Only run the query if id is defined
  });

  return {
    client,
    isLoadingClient,
    error
  };
};
