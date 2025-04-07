
export interface WidgetSettings {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  button_text?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  logo_url?: string;
  chat_color?: string;
  is_active?: boolean;
  auto_open?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon_type?: 'chat' | 'message' | 'custom';
  custom_icon_url?: string;
  greeting_message?: string;
  display_mode?: string;
  agent_name?: string;
  agent_description?: string;
  logo_storage_path?: string;
  chat_font_color?: string;
  font_color?: string;
  background_opacity?: number;
  welcome_text?: string;
  response_time_text?: string;
}
