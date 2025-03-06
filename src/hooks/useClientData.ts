
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  const [resolvedClientId, setResolvedClientId] = useState<string | undefined>(id);
  
  // If in client view but no ID is passed, use the client ID from user metadata
  useEffect(() => {
    console.log("useClientData - ID provided:", id);
    console.log("useClientData - User metadata client_id:", user?.user_metadata?.client_id);
    
    if (id) {
      setResolvedClientId(id);
    } else if (user?.user_metadata?.client_id) {
      console.log("Using client ID from user metadata:", user.user_metadata.client_id);
      setResolvedClientId(user.user_metadata.client_id);
    }
  }, [id, user]);
  
  console.log("useClientData - Resolved client ID being used:", resolvedClientId);
  
  // Only proceed with client data fetching if we have a resolvedClientId
  const { client, isLoadingClient, error } = useClient(resolvedClientId);
  const clientMutation = useClientMutation(resolvedClientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId: resolvedClientId
  };
};
