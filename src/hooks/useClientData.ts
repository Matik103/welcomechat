
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  
  // Only use the user metadata client ID in specific cases:
  // 1. We're in client view (userRole is 'client')
  // 2. No ID was explicitly provided
  let clientId = id;
  if (!clientId && userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
  }
  
  // Log this info for debugging
  console.log("useClientData: id param =", id);
  console.log("useClientData: user metadata client_id =", user?.user_metadata?.client_id);
  console.log("useClientData: user role =", userRole);
  console.log("useClientData: using clientId =", clientId);
  
  const clientQuery = useClient(clientId || '');
  
  const clientMutation = useClientMutation();
  
  // Force a refetch if we have a clientId but no data yet
  useEffect(() => {
    if (clientId && !clientQuery.data && !clientQuery.isLoading && !clientQuery.error) {
      console.log("Forcing initial client data fetch for ID:", clientId);
      clientQuery.refetch();
    }
  }, [clientId, clientQuery]);

  return {
    client: clientQuery.data,
    isLoadingClient: clientQuery.isLoading,
    error: clientQuery.error,
    clientMutation,
    clientId: clientId, // Keep the property name as clientId for backward compatibility
    refetchClient: clientQuery.refetch
  };
};
