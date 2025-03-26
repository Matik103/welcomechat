
export interface Client {
  id: string;
  client_id: string;
  user_id?: string;
  client_name: string;
  company: string;
  description: string;
  email: string;
  logo_url: string;
  logo_storage_path: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  deletion_scheduled_at: null | string;
  status: 'active' | 'inactive' | 'deleted';
  last_active: null | string;
  agent_name: string;
  agent_description: string;
  name: string;
  is_error: boolean;
  widget_settings: Record<string, any>;
}
