
import { z } from "zod";

// Widget settings schema
export const widgetSettingsSchema = z.object({
  agent_name: z.string().optional().default(""),
  agent_description: z.string().optional().default(""),
  logo_url: z.string().optional().default(""),
  logo_storage_path: z.string().optional(),
});

// Client form schema
export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  client_id: z.string().optional(), // Add client_id field as optional
  widget_settings: widgetSettingsSchema.optional().default({}),
  _tempLogoFile: z.any().optional(), // For file uploads
});

// Types derived from schemas
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Additional custom types
export type ClientFormErrors = {
  [key in keyof ClientFormData]?: string;
};
