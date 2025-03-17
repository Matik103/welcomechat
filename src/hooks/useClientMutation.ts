
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
          console.log("Creating client record...");
          clientId = await createClient(updatedData);
          console.log("Client record created with ID:", clientId);
          
          // Step 2: Try to send the invitation email
          try {
            console.log("Sending invitation email for client:", clientId);
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
              // If account creation failed, we want to show this error
              throw new Error(`Failed to create user account: ${inviteResult.error}`);
            } else if (!inviteResult.emailSent && inviteResult.error) {
              console.warn("Client account created but email failed:", inviteResult.error);
              // This is a warning but not a fatal error as the account was created
            }
          } catch (emailError: any) {
            console.error("Failed to send invitation email:", emailError);
            errorMessage = emailError.message || JSON.stringify(emailError);
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
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(`Client operation failed: ${error.message || "Unknown error"}`);
    }
  });

  return clientMutation;
};
