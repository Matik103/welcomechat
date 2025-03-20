
import { z } from "zod";

// Base schema for widget settings
export const widgetSettingsSchema = z.object({
  agent_name: z.string()
    .transform(val => val?.trim())
    .refine(val => !val?.includes('"'), {
      message: "Agent name cannot contain double quotes"
    })
    .refine(val => !val?.includes("'"), {
      message: "Agent name cannot contain single quotes"
    })
    .optional(),
  agent_description: z.string()
    .transform(val => val?.trim())
    .optional(),
  logo_url: z.string().optional(),
});

// Main form schema
export const clientFormSchema = z.object({
  client_name: z.string()
    .min(1, "Name is required")
    .transform(val => val.trim()),
  email: z.string()
    .email("Invalid email address")
    .transform(val => val.toLowerCase().trim()),
  widget_settings: widgetSettingsSchema.optional(),
  _tempLogoFile: z.any().optional(), // File type for logo upload
});

// Type for the form data
export type ClientFormData = {
  client_name: string;
  email: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
  };
  _tempLogoFile?: File | null;
};

// Type for widget settings errors
export type WidgetSettingsErrors = {
  agent_name?: string;
  agent_description?: string;
  logo_url?: string;
};

// Type for form errors
export type ClientFormErrors = {
  client_name?: string;
  email?: string;
  widget_settings?: WidgetSettingsErrors;
  _tempLogoFile?: string;
};

// Type for form submission response
export interface ClientFormSubmissionResponse {
  success: boolean;
  agentId?: string;
  error?: string;
}
