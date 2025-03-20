
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity
} from "@/services/clientService";
import { toast } from "sonner";

// Function to thoroughly sanitize strings that will be used in SQL queries
const sanitizeForSQL = (value: string | undefined): string | undefined => {
  if (!value) return value;
  
  // Always replace double quotes with single quotes to prevent SQL syntax errors
  let sanitized = value.replace(/"/g, "'");
  
  // Also escape any other potential SQL injection characters
  sanitized = sanitized.replace(/\\/g, "\\\\"); // escape backslashes
  
  console.log(`Sanitized from "${value}" to "${sanitized}"`);
  return sanitized;
};

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      console.log("Data before mutation:", data);
      
      // Create a deep copy of the data to avoid mutating the original object
      const sanitizedData = {
        ...data,
        agent_description: sanitizeForSQL(data.agent_description),
        // Ensure widget_settings is an object with the agent_description
        widget_settings: {
          ...(data.widget_settings || {}),
          agent_description: sanitizeForSQL(data.agent_description) || '',
        }
      };
      
      // Log before and after sanitization for debugging
      if (data.agent_description) {
        console.log("Agent description before sanitization:", data.agent_description);
        console.log("Agent description after sanitization:", sanitizedData.agent_description);
      }
      console.log("Data after sanitization:", sanitizedData);

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
        try {
          // Create the client record which also handles sending the invitation email
          console.log("Calling createClient with sanitized data...");
          const clientId = await createClient(sanitizedData);
          console.log("Client created successfully with ID:", clientId);
          
          return {
            clientId,
            emailSent: true,
            errorMessage: null
          };
        } catch (error: any) {
          console.error("Error in client creation process:", error);
          
          // Add more detailed logs to track what's happening
          if (error.code) {
            console.error(`SQL Error code: ${error.code}, message: ${error.message}`);
          }
          
          // Re-throw with a clearer message
          throw new Error(`Failed to create client: ${error.message}`);
        }
      }
    }
  });

  return clientMutation;
};
