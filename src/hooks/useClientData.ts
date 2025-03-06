
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  
  // If in client view but no ID is passed, use the client ID from user metadata
  const clientId = id || user?.user_metadata?.client_id;
  
  console.log("useClientData - DEBUG - id provided:", id);
  console.log("useClientData - DEBUG - user metadata client_id:", user?.user_metadata?.client_id);
  console.log("useClientData - DEBUG - clientId being used:", clientId);
  
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
