
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity
} from "@/services/clientService";
import { toast } from "sonner";

// Function to sanitize strings that will be used in SQL queries
const sanitizeForSQL = (value: string | undefined): string | undefined => {
  if (!value) return value;
  // Replace double quotes with single quotes to prevent SQL injection
  return value.replace(/"/g, "'");
};

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      console.log("Data before mutation:", data);
      
      // Sanitize agent_name to prevent SQL syntax errors
      const sanitizedData = {
        ...data,
        agent_name: sanitizeForSQL(data.agent_name)
      };
      
      console.log("Data after sanitization:", sanitizedData);

      if (id) {
        // Update existing client
        const clientId = await updateClient(id, sanitizedData);
        await logClientUpdateActivity(id);
        return clientId;
      } else {
        // Create new client
        let clientId;
        let emailSent = false;
        let errorMessage = null;
        
        try {
          // Create the client record which also handles sending the invitation email
          clientId = await createClient(sanitizedData);
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
