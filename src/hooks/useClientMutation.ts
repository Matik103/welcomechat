
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity,
  sendClientInvitationEmail
} from "@/services/client";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
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
        let clientId;
        let emailSent = false;
        let errorMessage = null;
        
        try {
          // Step 1: Create the client record first
          clientId = await createClient(updatedData);
          
          // Step 2: Try to send the invitation email
          try {
            const inviteResult = await sendClientInvitationEmail({
              clientId: clientId,
              clientName: data.client_name,
              email: data.email,
              agentName: finalAgentName
            });
            
            emailSent = inviteResult.emailSent;
            errorMessage = inviteResult.error;
            
            if (!inviteResult.success && !inviteResult.emailSent) {
              console.error("Failed to create user account:", inviteResult.error);
            } else if (!inviteResult.emailSent && inviteResult.error) {
              console.warn("Client account created but email failed:", inviteResult.error);
            }
          } catch (emailError: any) {
            console.error("Failed to send invitation email:", emailError);
            errorMessage = emailError.message;
            // Continue with client creation even if email fails
          }
        } catch (error: any) {
          console.error("Error in client creation process:", error);
          throw error; // Rethrow to trigger the mutation's error handling
        }
        
        return {
          clientId,
          emailSent,
          errorMessage
        };
      }
    }
  });

  return clientMutation;
};
