
import { clientFormSchema, ClientFormData } from "@/types/client-form";

/**
 * Validates client form data using Zod schema
 */
export const validateClientData = (data: ClientFormData) => {
  // Validate the data before sending to the service
  const validationResult = clientFormSchema.safeParse(data);
  if (!validationResult.success) {
    console.error("Validation errors:", validationResult.error.format());
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

  return validatedData;
};
