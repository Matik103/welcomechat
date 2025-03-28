
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  
  // Only use the user metadata client ID in specific cases:
  // 1. We're in client view (userRole is 'client')
  // 2. No ID was explicitly provided
  let clientId = id;
  if (!clientId && userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
  }
  
  // Get client data with staleTime to prevent excessive refetching
  const { 
    client, 
    isLoading, 
    error,
    refetch
  } = useClient(clientId || '', {
    staleTime: 300000, // 5 minutes
    cacheTime: 600000,  // 10 minutes
  });
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  const refetchClient = useCallback(() => {
    if (clientId) {
      return refetch();
    }
    return Promise.resolve();
  }, [clientId, refetch]);

  return {
    client,
    isLoadingClient: isLoading,
    error,
    clientMutation,
    clientId: clientId, // Keep the property name as clientId for backward compatibility
    refetchClient
  };
};
