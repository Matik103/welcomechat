
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
      console.log("Data JSON stringified:", JSON.stringify(data));
      console.log("Agent name type:", typeof data.agent_name);
      
      // Create a deep copy of the data to avoid mutating the original object
      const sanitizedData = {
        ...data,
        agent_name: sanitizeForSQL(data.agent_name)
      };
      
      console.log("Data after sanitization:", sanitizedData);
      console.log("Data after sanitization JSON stringified:", JSON.stringify(sanitizedData));
      console.log("Agent name before:", data.agent_name);
      console.log("Agent name after sanitization:", sanitizedData.agent_name);

      if (id) {
        // Update existing client
        try {
          const clientId = await updateClient(id, sanitizedData);
          await logClientUpdateActivity(id);
          return clientId;
        } catch (error) {
          console.error("Error updating client in mutation:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          throw error;
        }
      } else {
        // Create new client
        let clientId;
        let emailSent = false;
        let errorMessage = null;
        
        try {
          // Create the client record which also handles sending the invitation email
          console.log("Calling createClient with sanitized data...");
          clientId = await createClient(sanitizedData);
          console.log("Client created successfully with ID:", clientId);
          
          // The email is already sent in createClient, so we don't need to send it again here
          emailSent = true;
        } catch (error: any) {
          console.error("Error in client creation process:", error);
          console.error("Error stack:", error.stack);
          console.error("Error stringified:", JSON.stringify(error, null, 2));
          if (error.code) {
            console.error(`SQL Error code: ${error.code}, message: ${error.message}`);
          }
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
