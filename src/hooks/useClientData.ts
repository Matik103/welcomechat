
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
  
  // When creating a new client, there's no client ID yet, and that's OK
  const isCreationMode = !id && !user?.user_metadata?.client_id;
  
  // Only fetch client data if we have a client ID or we're not in creation mode
  const { client, isLoadingClient, error } = useClient(clientId);
  
  // For client mutation, we need to handle both existing clients (with IDs) and new clients (without IDs)
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation } = useClientInvitation();

  // Debug output for non-creation mode
  useEffect(() => {
    if (!clientId && !isCreationMode) {
      console.warn("No client ID available in useClientData. This might cause issues with data operations.");
    }
  }, [clientId, isCreationMode]);

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId,
    isCreationMode
  };
};
