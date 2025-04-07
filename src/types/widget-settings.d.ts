
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
  [key: string]: any;
}
