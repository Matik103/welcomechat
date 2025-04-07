
export interface WidgetSettings {
  agent_name?: string;
  agent_description?: string;
  client_id?: string;
  clientId?: string;
  client_name?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  logo?: string;
  logo_path?: string;
  logo_url?: string;
  logo_storage_path?: string;
  company?: string;
  email?: string;
  welcome_message?: string;
  openai_enabled?: boolean;
  deepseek_enabled?: boolean;
  deepseek_model?: string;
  deepseek_assistant_id?: string;
  
  // Properties from the default WidgetSettings type
  chat_color?: string;
  background_color?: string;
  button_color?: string;
  font_color?: string;
  chat_font_color?: string;
  background_opacity?: number;
  button_text?: string;
  position?: "left" | "right";
  greeting_message?: string;
  text_color?: string;
  secondary_color?: string;
  welcome_text?: string;
  response_time_text?: string;
  display_mode?: string;
  openai_assistant_id?: string;
  openai_model?: string;
  created_at?: string;
  updated_at?: string;
  
  [key: string]: any;
}
