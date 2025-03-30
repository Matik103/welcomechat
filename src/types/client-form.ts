import { z } from 'zod';
import { WidgetDisplayMode } from './widget-settings';

export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_updated'
  | 'website_url_added'
  | 'url_deleted'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'system_update'
  | 'webhook_sent'
  | 'error_logged'
  | 'chat_interaction'
  | 'widget_settings_updated'  // Added this missing activity type
  | 'logo_uploaded'           // Added this missing activity type
  | 'widget_previewed'        // Added this missing activity type
  | 'profile_updated';        // Added for profile updates

// Define the structure for widget settings - align with widget-settings.ts
export interface WidgetSettings {
  agent_name: string;
  agent_description: string;
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  button_color?: string;
  font_color: string;
  chat_font_color: string;
  background_opacity: number;
  button_text: string;
  position: "left" | "right";
  greeting_message: string;
  text_color: string;
  secondary_color: string;
  welcome_text: string;
  response_time_text: string;
  display_mode: WidgetDisplayMode;
  // Backward compatibility fields
  initial_message?: string;
  placement?: string;
  primary_color?: string;
  font_family?: string;
}

// Default widget settings
export const defaultSettings: WidgetSettings = {
  agent_name: "AI Assistant",
  agent_description: "Your helpful AI assistant",
  logo_url: "",
  logo_storage_path: "",
  chat_color: "#4f46e5",
  background_color: "#ffffff",
  button_color: "#4f46e5",
  font_color: "#111827",
  chat_font_color: "#ffffff",
  background_opacity: 1,
  button_text: "Chat with Us",
  position: "right",
  greeting_message: "Hello! How can I help you today?",
  text_color: "#111827",
  secondary_color: "#6366f1",
  welcome_text: "Welcome to our assistant",
  response_time_text: "Typically responds in a few seconds",
  display_mode: "standard",
  // For backward compatibility
  initial_message: "Hello! How can I help you today?",
  placement: "bottom-right",
  primary_color: "#2563EB",
  font_family: "Inter, system-ui, sans-serif",
};

// Define the schema for form validation
export const clientFormSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Email is required'),
  agent_name: z.string().min(1, 'AI Agent name is required'),
  agent_description: z.string().optional(),
  logo_url: z.string().optional(),
  logo_storage_path: z.string().optional(),
});

// Extract the TypeScript type from the schema
export type ClientFormData = z.infer<typeof clientFormSchema>;
