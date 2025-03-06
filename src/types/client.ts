
export interface DriveLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  created_at: string;
  updated_at: string;
  file_id?: string;
  access_status?: 'accessible' | 'restricted' | 'unknown';
}

export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  client_name: string;
  email: string;
  agent_name: string;
  widget_settings?: Record<string, any>;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientFormData {
  client_name: string;
  email: string;
  agent_name: string;
  widget_settings?: Record<string, any>;
}
