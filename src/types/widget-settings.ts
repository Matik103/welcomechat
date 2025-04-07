
// Define a common display mode type that can be used across components
export type WidgetDisplayMode = 'floating' | 'inline' | 'sidebar' | string;

// Define the widget settings type that's compatible across the application
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
  openai_assistant_id?: string;
  clientId?: string; // Added clientId property
  deepseek_enabled?: boolean;
  deepseek_model?: string;
  openai_enabled?: boolean;
  openai_model?: string;
  created_at?: string;
  updated_at?: string;
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
  display_mode: "floating",
  deepseek_enabled: true,
  deepseek_model: "deepseek-chat",
  openai_enabled: false,
  openai_model: "",
  openai_assistant_id: ""
};
