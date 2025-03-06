
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  sendClientInvitation,
  sendFallbackEmail
} from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        if (!id) {
          throw new Error("Client ID is required for this operation");
        }
        
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
          const newClientId = await createClient(updatedData);
          
          try {
            toast.info("Sending setup email...");
            
            try {
              console.log("Calling send-client-invitation edge function");
              await sendClientInvitation(
                newClientId, 
                updatedData.email, 
                updatedData.client_name
              );
              toast.success("Setup email sent to client");
            } catch (inviteError) {
              console.error("Exception in invitation process:", inviteError);
              toast.error(`Failed to send setup email: ${inviteError.message || "Unknown error"}`);
              
              try {
                await sendFallbackEmail(updatedData.email);
                toast.success("Setup email sent to client (basic version)");
              } catch (fallbackError) {
                console.error("Failed to send fallback email:", fallbackError);
              }
            }
          } catch (setupError) {
            console.error("Error in client setup process:", setupError);
            toast.error(`Error during client setup: ${setupError.message || "Unknown error"}`);
          }

          return newClientId;
        }
      } catch (error) {
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
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return clientMutation;
};
