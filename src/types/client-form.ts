
import { z } from "zod";

// Schema for widget settings
export const widgetSettingsSchema = z.object({
  agent_name: z.string().optional().default(""),
  agent_description: z.string().optional().default(""),
  logo_url: z.string().optional().default(""),
});

// Schema for client form data
export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  widget_settings: widgetSettingsSchema.optional().default({
    agent_name: "",
    agent_description: "",
    logo_url: "",
  }),
  _tempLogoFile: z.any().optional(),
});

// Type for client form data
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Type for client form errors
export type ClientFormErrors = {
  [K in keyof ClientFormData]?: string;
};

// Extended type with nested errors for widget settings
export interface ClientFormErrorsWithNested extends Omit<ClientFormErrors, 'widget_settings'> {
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
  };
}
