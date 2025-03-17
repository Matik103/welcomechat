
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
          console.log("Client created successfully with ID:", clientId);
          
          // Step 2: Try to send the invitation email
          try {
            console.log("Attempting to send invitation email for client", clientId);
            await sendClientInvitationEmail({
              clientId: clientId,
              clientName: data.client_name,
              email: data.email,
              agentName: finalAgentName
            });
            
            emailSent = true;
            console.log("Invitation email sent successfully");
          } catch (emailError: any) {
            console.error("Failed to send invitation email:", emailError);
            errorMessage = emailError.message || "Unknown email sending error";
            // Continue with client creation even if email fails
            toast.warning(`Client created but couldn't send invitation email. The client can still access their account with the credentials you provide them manually.`);
          }
        } catch (error: any) {
          console.error("Error in client creation process:", error);
          throw new Error(`Failed to create client: ${error.message}`);
        }
        
        if (!emailSent && errorMessage) {
          // If client was created but email failed, still return client ID but with error info
          console.log(`Client created but email failed: ${errorMessage}`);
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
