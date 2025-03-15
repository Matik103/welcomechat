
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  sendClientInvitation,
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
          // Create new client
          toast.info("Creating client...");
          const newClientId = await createClient(updatedData);
          
          // Try to create client user account with temporary password
          try {
            await createClientUserAccount(
              newClientId, 
              updatedData.email, 
              updatedData.client_name, 
              updatedData.agent_name
            );
            toast.success("Client account created successfully with temporary password");
          } catch (accountError) {
            console.error("Failed to create client user account:", accountError);
            toast.error("Client created but failed to set up user account. Manual setup required.");
            
            // Fall back to sending invitation if account creation fails
            try {
              await sendClientInvitation(newClientId, updatedData.email, updatedData.client_name);
              toast.success("Invitation email sent as fallback");
            } catch (inviteError: any) {
              console.error("Failed to send invitation email:", inviteError);
              toast.error("Also failed to send invitation email: " + (inviteError.message || "Unknown error"));
            }
          }
          
          return newClientId;
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: (clientId) => {
      if (id) {
        toast.success("Client updated successfully");
      } else {
        toast.success("Client created successfully");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message || "Failed to perform operation"}`);
    },
  });

  return clientMutation;
};
