
import { Json } from "@/integrations/supabase/types";

export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "left" | "right";

export interface WidgetSettings {
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  text_color: string;
  secondary_color: string;
  position: WidgetPosition;
  welcome_text: string;
  response_time_text: string;
  // agent_name removed as it's no longer used
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
  position: "bottom-right",
  welcome_text: "Hi there! How can I help you today?",
  response_time_text: "Usually responds within a few minutes"
};

// Helper function to convert widget settings to JSON for database storage
export const convertSettingsToJSON = (settings: Partial<WidgetSettings>): Record<string, Json> => {
  return Object.entries(settings).reduce((acc, [key, value]) => {
    acc[key] = value as Json;
    return acc;
  }, {} as Record<string, Json>);
};
