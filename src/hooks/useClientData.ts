
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";

export const useClientData = (id: string | undefined) => {
  const { client, isLoadingClient, error } = useClient(id);
  const clientMutation = useClientMutation(id);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation
  };
};
