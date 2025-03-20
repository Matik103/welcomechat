
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { createClient } from "@/services/clientService";
import { toast } from "sonner";

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
            agent_name: "AI Assistant",
            agent_description: "",
            logo_url: ""
          };
        } else if (!validatedData.widget_settings.agent_name) {
          validatedData.widget_settings.agent_name = "AI Assistant";
        }

        // Create the client with validated data
        const result = await createClient({
          client_name: validatedData.client_name.trim(),
          email: validatedData.email.trim().toLowerCase(),
          widget_settings: {
            agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
            agent_description: validatedData.widget_settings.agent_description?.trim() || "",
            logo_url: validatedData.widget_settings.logo_url || ""
          }
        });

        return result;
      } catch (error) {
        console.error("Error creating client:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to create client");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}; 
