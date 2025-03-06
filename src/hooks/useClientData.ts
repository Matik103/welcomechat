
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  // Prioritize the ID passed as an argument, fall back to user metadata
  const clientId = id || user?.user_metadata?.client_id;
  
  const { client, isLoadingClient, error } = useClient(clientId);
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId
  };
};
