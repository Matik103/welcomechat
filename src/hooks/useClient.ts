
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
      if (!id) return null;
      return getClientById(id);
    },
    enabled: !!id,
  });

  return {
    client,
    isLoadingClient,
    error
  };
};
