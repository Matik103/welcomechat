
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
          const newClientId = await createClient(updatedData);
          
          // Track client creation outcome
          let emailSent = false;
          
          // Send invitation email
          try {
            await sendClientInvitationEmail({
              clientId: newClientId,
              clientName: data.client_name,
              email: data.email,
              agentName: finalAgentName
            });
            
            emailSent = true;
          } catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            // Continue with client creation even if email fails
          }
          
          return {
            clientId: newClientId,
            emailSent: emailSent
          };
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    }
  });

  return clientMutation;
};
