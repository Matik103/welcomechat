
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { createAgent } from "@/services/clientService";
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

        // Create the AI agent with validated data
        const result = await createAgent({
          client_name: validationResult.data.client_name.trim(),
          email: validationResult.data.email.trim().toLowerCase(),
          widget_settings: validationResult.data.widget_settings ? {
            agent_name: validationResult.data.widget_settings.agent_name?.trim(),
            agent_description: validationResult.data.widget_settings.agent_description?.trim(),
            logo_url: validationResult.data.widget_settings.logo_url
          } : undefined
        });

        return result;
      } catch (error) {
        console.error("Error creating AI agent:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to create AI agent");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
