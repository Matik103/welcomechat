
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  
  // If in client view but no ID is passed, use the client ID from user metadata
  const clientId = id || user?.user_metadata?.client_id;
  
  // Log this info for debugging
  console.log("useClientData: id param =", id);
  console.log("useClientData: user metadata client_id =", user?.user_metadata?.client_id);
  console.log("useClientData: using clientId =", clientId);
  
  const { client, isLoadingClient, error, refetchClient } = useClient(clientId);
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId,
    refetchClient
  };
};
