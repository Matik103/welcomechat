
import { z } from "zod";

export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email format"),
  description: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional(),
  _tempLogoFile: z.any().optional()
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
