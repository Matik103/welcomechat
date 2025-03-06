
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
  
  console.log("useClientData - id provided:", id);
  console.log("useClientData - user metadata client_id:", user?.user_metadata?.client_id);
  console.log("useClientData - clientId being used:", clientId);
  
  const { client, isLoadingClient, error } = useClient(clientId);
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation } = useClientInvitation();

  // Debug output
  useEffect(() => {
    if (!clientId) {
      console.warn("No client ID available in useClientData. This might cause issues with data operations.");
    }
  }, [clientId]);

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId
  };
};
