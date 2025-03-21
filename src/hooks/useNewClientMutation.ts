
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client-form";
import { toast } from "sonner";
import { validateClientData } from "@/utils/clientValidationUtils";
import { sendWelcomeEmail } from "@/utils/emailUtils";
import { 
  createClientInDatabase,
  logClientCreationActivity,
  createClientUserAccount,
  setupClientPassword
} from "@/utils/clientAccountUtils";
import { setupOpenAIAssistant } from "@/utils/clientOpenAIUtils";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        // Validate client data
        const validatedData = validateClientData(data);

        // Create client record in the database
        const newAgent = await createClientInDatabase(validatedData);

        // Get clientId - either from the client_id field or use the id if client_id is not set
        const clientId = newAgent.client_id || newAgent.id;

        // Log the client creation activity
        await logClientCreationActivity(
          clientId,
          validatedData.client_name.trim(),
          validatedData.email.trim().toLowerCase(),
          validatedData.widget_settings.agent_name?.trim() || "AI Assistant"
        );

        // Create OpenAI assistant using the client's chatbot settings
        await setupOpenAIAssistant(
          clientId,
          validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
          validatedData.widget_settings.agent_description?.trim() || "",
          validatedData.client_name.trim()
        );

        // Generate and store temporary password
        const tempPassword = await setupClientPassword(
          clientId, 
          validatedData.email.trim().toLowerCase()
        );
        
        // Create user account and send welcome email with credentials
        try {
          // Create the client user account
          await createClientUserAccount(
            validatedData.email.trim().toLowerCase(),
            clientId,
            validatedData.client_name.trim(),
            validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
            validatedData.widget_settings.agent_description?.trim() || "",
            tempPassword
          );
          
          // Show toast notification for email sending
          toast.loading("Sending welcome email with login credentials...");
          
          // Send welcome email with login credentials
          const emailResult = await sendWelcomeEmail(
            validatedData.email.trim().toLowerCase(),
            validatedData.client_name.trim(),
            tempPassword
          );
          
          toast.dismiss(); // Clear the loading toast
          
          if (!emailResult.emailSent) {
            // We still return success since the client was created
            return {
              clientId: clientId,
              agentId: newAgent.id,
              emailSent: false,
              emailError: emailResult.emailError
            };
          }
          
          toast.success("Welcome email sent successfully!");
          
          return {
            clientId: clientId,
            agentId: newAgent.id,
            emailSent: true
          };
        } catch (emailError) {
          console.error("Error in email/user creation process:", emailError);
          // Continue even if email sending fails, but we'll return detailed info
          return {
            clientId: clientId,
            agentId: newAgent.id,
            emailSent: false,
            emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
          };
        }
      } catch (error) {
        console.error("Error creating client:", error);
        // Ensure we always have a meaningful error message
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Failed to create client. Please try again.");
        }
      }
    },
    onError: (error: Error) => {
      // Make sure we have a user-friendly error message
      const errorMessage = error.message || "Failed to create client. Please try again.";
      toast.error(errorMessage);
    }
  });
};
