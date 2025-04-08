
export interface Client {
  id: string;
  client_id?: string;
  client_name: string;
  email: string;
  company?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  agent_name?: string;
  logo_url?: string;
  logo_storage_path?: string;
  widget_settings?: any;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  openai_assistant_id?: string;
  deepseek_assistant_id?: string;
  // Additional fields needed for proper functioning
  deleted_at?: string | null;
  deletion_scheduled_at?: string | null;
  last_active?: string | null;
}
