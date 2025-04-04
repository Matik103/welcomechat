
// Define a common display mode type that can be used across components
export type WidgetDisplayMode = 'standard' | 'minimal' | 'full' | string;

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
  
  // Add these properties for compatibility with WidgetSettings.tsx
  primaryColor?: string;
  secondaryColor?: string;
  border_radius?: number;
  borderRadius?: number;
  font_family?: string;
  fontFamily?: string;
  show_agent_availability?: boolean;
  is_active?: boolean;
  
  // Additional properties
  primary_color?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  openai_assistant_id?: string;
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
  // Add default values for the new properties
  primaryColor: "#4f46e5",
  secondaryColor: "#6366f1",
  border_radius: 8,
  borderRadius: 8,
  font_family: "Inter, system-ui, sans-serif",
  fontFamily: "Inter, system-ui, sans-serif",
  show_agent_availability: false,
  is_active: true,
  primary_color: "#4f46e5"
};
