
import { Json } from "@/integrations/supabase/types";

export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "left" | "right";
export type WidgetDisplayMode = "floating" | "inline" | "sidebar";

export interface WidgetSettings {
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  text_color: string;
  secondary_color: string;
  position: "left" | "right";  // Simplified to match client-form type
  welcome_text: string;
  response_time_text: string;
  agent_name: string; // Agent name for the widget
  agent_description: string; // Agent description stored in widget_settings
  openai_assistant_id?: string; // OpenAI assistant ID
  display_mode: WidgetDisplayMode; // Widget display mode - new field
  font_color?: string;
  chat_font_color?: string;
  background_opacity?: number;
  button_text?: string;
  button_color?: string;
  greeting_message?: string;
}

export const isWidgetSettings = (settings: unknown): settings is WidgetSettings => {
  return (
    typeof settings === "object" &&
    settings !== null &&
    (
      // A valid settings object should have at least these properties
      'chat_color' in settings ||
      'background_color' in settings ||
      'logo_url' in settings
    )
  );
};

export const defaultSettings: WidgetSettings = {
  logo_url: "",
  logo_storage_path: "",
  chat_color: "#854fff",
  background_color: "#ffffff",
  text_color: "#333333",
  secondary_color: "#f0f0f0",
  position: "right",
  welcome_text: "Hi there! How can I help you today?",
  response_time_text: "Usually responds within a few minutes",
  agent_name: "Chat", // Default agent name
  agent_description: "", // Default empty agent description
  display_mode: "floating" // Default display mode is floating
};

// Helper function to convert widget settings to JSON for database storage
export const convertSettingsToJSON = (settings: Partial<WidgetSettings>): Record<string, Json> => {
  return Object.entries(settings).reduce((acc, [key, value]) => {
    acc[key] = value as Json;
    return acc;
  }, {} as Record<string, Json>);
};
