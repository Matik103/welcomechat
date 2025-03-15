
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  createClientUserAccount
} from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
        const updatedData = {
          ...data,
          agent_name: finalAgentName,
        };

        if (id) {
          const clientId = await updateClient(id, updatedData);
          await logClientUpdateActivity(id);
          return clientId;
        } else {
          // When creating new client, only show one toast notification
          const newClientId = await createClient(updatedData);
          
          // Try to create client user account without sending email
          try {
            await createClientUserAccount(
              newClientId, 
              updatedData.email, 
              updatedData.client_name, 
              updatedData.agent_name
            );
          } catch (accountError) {
            console.error("Failed to create client user account:", accountError);
          }
          
          return newClientId;
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: (clientId) => {
      // Only display one success notification based on whether we're updating or creating
      if (id) {
        toast.success("Client updated successfully");
      } else {
        // This is the only toast notification that will be shown when creating a client
        toast.success("Client created successfully");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message || "Failed to perform operation"}`);
    },
  });

  return clientMutation;
};
