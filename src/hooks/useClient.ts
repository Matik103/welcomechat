
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
      return getClientById(id);
    },
    enabled: true, // Always enable the query, even if id is undefined
  });

  return {
    client,
    isLoadingClient,
    error
  };
};
