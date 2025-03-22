
import { z } from "zod";

// Form validation schema
export const clientFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  logo_url: z.string().optional(),
  logo_storage_path: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional(),
  }).optional(),
  _tempLogoFile: z.any().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export interface ClientFormErrors {
  [key: string]: string;
}
