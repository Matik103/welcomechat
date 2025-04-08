
import { WidgetSettings } from "./widget-settings";

export interface Client {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  company: string;
  description: string;
  logo_url: string;
  logo_storage_path: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  last_active: string | null;
  status: string;
  agent_name: string;
  agent_description: string;
  widget_settings: Record<string, any>;
  name: string;
  is_error: boolean;
  user_id?: string;
  openai_assistant_id?: string;
  deepseek_assistant_id?: string;
}

export interface ClientListResponse {
  data: Client[];
  count: number;
}
