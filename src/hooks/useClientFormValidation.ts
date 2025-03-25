
import { z } from "zod";

export const createClientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string()
    .transform(val => val.trim())
    .refine(val => !val.includes('"'), {
      message: "Agent name cannot contain double quotes"
    })
    .refine(val => !val.includes("'"), {
      message: "Agent name cannot contain single quotes"
    })
    .optional(),
  agent_description: z.string().optional(),
  logo_url: z.string().optional(),
  logo_storage_path: z.string().optional(),
});

// Create a more strict client view schema that requires agent fields
export const clientViewSchema = createClientFormSchema.extend({
  agent_name: z.string()
    .min(1, "Agent name is required")
    .transform(val => val.trim())
    .refine(val => !val.includes('"'), {
      message: "Agent name cannot contain double quotes"
    })
    .refine(val => !val.includes("'"), {
      message: "Agent name cannot contain single quotes"
    }),
  agent_description: z.string().min(1, "Agent description is required"),
});

export const useClientFormValidation = (isClientView: boolean = false) => {
  const schema = isClientView ? clientViewSchema : createClientFormSchema;
  return { schema };
};
