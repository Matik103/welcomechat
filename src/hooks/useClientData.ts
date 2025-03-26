
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";

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
  
  const { 
    client, 
    isLoading, 
    error,
    refetch
  } = useClient(clientId || '');
  
  const clientMutation = useClientMutation();

  return {
    client,
    isLoadingClient: isLoading,
    error,
    clientMutation,
    clientId: clientId, // Keep the property name as clientId for backward compatibility
    refetchClient: refetch
  };
};
