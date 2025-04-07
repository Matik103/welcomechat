export interface Client {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  status?: string;
  widget_settings?: WidgetSettings;
  agent_name?: string;
  agent_description?: string;
  created_at?: string;
  updated_at?: string;
  deepseek_assistant_id?: string;
  // Add other optional fields
  [key: string]: any;
}
