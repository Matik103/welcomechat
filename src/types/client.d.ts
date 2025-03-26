
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
}

export interface WebsiteUrl {
  id: number;
  url: string;
  refresh_rate: number;
  client_id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  scrapable?: boolean;
}

export interface Website {
  id: number;
  url: string;
  refresh_rate: number;
  client_id: string;
  created_at?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  scrapable: boolean;
}

export interface DocumentLink {
  id: number;
  link: string;
  refresh_rate: number;
  client_id: string;
  created_at?: string;
  access_status?: string;
  document_type?: string;
  notified_at?: string;
  status?: string;
}
