
import { z } from "zod";

// Widget settings schema
export const widgetSettingsSchema = z.object({
  agent_name: z.string().optional().default(""),
  agent_description: z.string().optional().default(""),
  logo_url: z.string().optional().default(""),
  logo_storage_path: z.string().optional(),
});

// Define the ActivityType enum to match the database enum
export type ActivityType =
  | "chat_interaction"
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "client_recovered"
  | "widget_settings_updated"
  | "website_url_added"
  | "website_url_deleted"
  | "drive_link_added"
  | "drive_link_deleted"
  | "document_link_added"
  | "document_link_deleted"
  | "document_uploaded"
  | "document_processed"
  | "document_processing_failed"
  | "agent_name_updated"
  | "agent_description_updated"
  | "agent_updated"
  | "agent_logo_updated"
  | "ai_agent_updated"
  | "ai_agent_created"
  | "error_logged"
  | "system_update";

// Client form schema
export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  client_id: z.string().optional(), // Ensure client_id field is properly defined
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
