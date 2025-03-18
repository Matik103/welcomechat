
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity
} from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      // Sanitize agent name to ensure it's valid (if provided)
      let finalAgentName = "";
      if (data.agent_name) {
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        
        finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
      }
      
      const updatedData = {
        ...data,
        agent_name: finalAgentName || undefined,
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
          // Create the client record which also handles sending the invitation email
          clientId = await createClient(updatedData);
          console.log("Client created successfully with ID:", clientId);
          
          // The email is already sent in createClient, so we don't need to send it again here
          emailSent = true;
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
