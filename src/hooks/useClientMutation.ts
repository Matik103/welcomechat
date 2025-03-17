
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  sendClientInvitationEmail
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
          
          try {
            // First create the client
            const newClientId = await createClient(updatedData);
            
            // Then send the invitation email - with retry logic
            try {
              await sendClientInvitationEmail({
                clientId: newClientId,
                clientName: data.client_name,
                email: data.email
              });
              toast.success("Invitation email sent successfully");
            } catch (emailError) {
              console.error("Failed to send invitation email on first attempt:", emailError);
              toast.loading("Retrying to send invitation email...");
              
              // Retry sending the email after a delay with a maximum of 3 retries
              let retryCount = 0;
              const maxRetries = 3;
              
              const attemptSendEmail = async () => {
                try {
                  await sendClientInvitationEmail({
                    clientId: newClientId,
                    clientName: data.client_name,
                    email: data.email
                  });
                  toast.success("Invitation email sent on retry");
                  return true;
                } catch (retryError) {
                  console.error(`Email retry attempt ${retryCount + 1} failed:`, retryError);
                  retryCount++;
                  
                  if (retryCount < maxRetries) {
                    // Wait longer with each retry
                    await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
                    return attemptSendEmail();
                  } else {
                    toast.error("Failed to send invitation email after multiple attempts. Please check client details and try manually.");
                    return false;
                  }
                }
              };
              
              // Start the retry process
              attemptSendEmail();
            }
            
            return newClientId;
          } catch (clientError) {
            console.error("Error creating client:", clientError);
            throw new Error("Failed to create client. Please try again.");
          }
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
