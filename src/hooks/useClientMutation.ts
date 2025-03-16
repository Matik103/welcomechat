
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
        // Sanitize agent name to ensure it's valid
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
          // Update existing client
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
            toast.error("Client created but failed to set up user account. Sending invitation email as fallback.");
            
            // Fall back to sending invitation if account creation fails
            try {
              await sendClientInvitation(newClientId, updatedData.email, updatedData.client_name);
              toast.success("Invitation email sent successfully");
            } catch (inviteError: any) {
              console.error("Failed to send invitation email:", inviteError);
              toast.error("Failed to send invitation email: " + (inviteError.message || "Unknown error"));
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
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message || "Failed to perform operation"}`);
    },
  });

  return clientMutation;
};
