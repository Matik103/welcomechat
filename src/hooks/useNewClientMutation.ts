
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { createClient } from "@/services/clientService";
import { toast } from "sonner";
import { createOpenAIAssistant } from "@/utils/openAIUtils";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        // Validate the data before sending to the service
        const validationResult = clientFormSchema.safeParse(data);
        if (!validationResult.success) {
          throw new Error("Invalid form data");
        }

        // Ensure widget_settings is properly defined
        const validatedData = validationResult.data;
        if (!validatedData.widget_settings) {
          validatedData.widget_settings = {
            agent_name: "",
            agent_description: "",
            logo_url: ""
          };
        }

        // Create the client with validated data
        const clientId = await createClient({
          client_name: validatedData.client_name.trim(),
          email: validatedData.email.trim().toLowerCase(),
          widget_settings: {
            agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
            agent_description: validatedData.widget_settings.agent_description?.trim() || "",
            logo_url: validatedData.widget_settings.logo_url || ""
          }
        });

        // Create OpenAI assistant using the client's chatbot settings
        if (validatedData.widget_settings.agent_name || validatedData.widget_settings.agent_description) {
          try {
            await createOpenAIAssistant(
              clientId,
              validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
              validatedData.widget_settings.agent_description?.trim() || "",
              validatedData.client_name.trim()
            );
          } catch (openaiError) {
            console.error("Error creating OpenAI assistant:", openaiError);
            // We continue even if OpenAI assistant creation fails
            // The client is still created, and the assistant can be created later
          }
        }

        return clientId;
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
    },
  });
};
