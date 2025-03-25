
import { z } from "zod";

// Define the client form schema using Zod
export const clientFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  agent_name: z.string().min(2, "Agent name must be at least 2 characters").max(50).optional(),
  agent_description: z.string().max(500, "Description must be 500 characters or less").optional(),
  logo_url: z.string().optional(),
  logo_storage_path: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().min(2, "Agent name must be at least 2 characters").max(50).optional(),
    agent_description: z.string().max(500, "Description must be 500 characters or less").optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional(),
  }).optional(),
  _tempLogoFile: z.any().optional(),
});

// Define the type based on the schema
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Define the error type for form validation
export interface ClientFormErrors {
  client_name?: string;
  email?: string;
  agent_name?: string;
  agent_description?: string;
  logo_url?: string;
  logo_storage_path?: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _form?: string;
  [key: string]: any;
}
