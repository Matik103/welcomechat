
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity
} from "@/services/clientService";
import { sanitizeForSQL } from "@/utils/inputSanitizer";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      console.log("Data before mutation:", data);
      
      // Create a deep copy of the data to avoid mutating the original object
      const sanitizedData: ClientFormData = {
        ...data,
        // Ensure widget_settings is an object
        widget_settings: {
          ...(typeof data.widget_settings === 'object' && data.widget_settings !== null 
              ? data.widget_settings 
              : {})
        }
      };
      
      // Get agent_description from widget_settings if it exists
      let agentDescription = "";
      if (typeof sanitizedData.widget_settings === 'object' && sanitizedData.widget_settings !== null) {
        const widgetSettings = sanitizedData.widget_settings as Record<string, any>;
        agentDescription = widgetSettings.agent_description || "";
      }
      
      // Store agent_description in widget_settings
      sanitizedData.widget_settings = {
        ...sanitizedData.widget_settings,
        agent_description: sanitizeForSQL(agentDescription)
      };
      
      // Thoroughly sanitize agent_name to prevent SQL issues
      if (data.agent_name) {
        sanitizedData.agent_name = sanitizeForSQL(data.agent_name);
        console.log("Agent name before sanitization:", data.agent_name);
        console.log("Agent name after sanitization:", sanitizedData.agent_name);
      } else {
        // Make sure the default value is also sanitized
        sanitizedData.agent_name = sanitizeForSQL('AI Assistant');
        console.log("Using default sanitized agent name:", sanitizedData.agent_name);
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
