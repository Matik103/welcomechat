export interface WidgetSettings {
  agent_name?: string;
  agent_description?: string;
  client_id?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  logo?: string;
  logo_path?: string;
  company?: string;
  client_name?: string;
  email?: string;
  openai_enabled?: boolean;
  deepseek_enabled?: boolean;
  deepseek_model?: string;
  deepseek_assistant_id?: string;
  [key: string]: any;
}
