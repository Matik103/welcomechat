
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  
  // Only use the user metadata client ID in specific cases:
  // 1. We're in client view (userRole is 'client')
  // 2. No ID was explicitly provided
  let agentId = id;
  if (!agentId && userRole === 'client' && user?.user_metadata?.client_id) {
    agentId = user.user_metadata.client_id;
  }
  
  // Log this info for debugging
  console.log("useClientData: id param =", id);
  console.log("useClientData: user metadata client_id =", user?.user_metadata?.client_id);
  console.log("useClientData: user role =", userRole);
  console.log("useClientData: using agentId =", agentId);
  
  const { client, isLoadingClient, error, refetchClient } = useClient(agentId);
  const clientMutation = useClientMutation(agentId);

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    clientId: agentId, // Keep the property name as clientId for backward compatibility
    refetchClient
  };
};
