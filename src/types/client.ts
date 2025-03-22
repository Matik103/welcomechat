
export interface Client {
  id: string;
  client_id?: string;
  client_name: string;
  email: string;
  agent_name?: string;
  agent_description?: string;
  description?: string;
  name?: string;
  logo_url?: string;
  logo_storage_path?: string;
  created_at?: string;
  updated_at?: string;
  deletion_scheduled_at?: string | null;
  deleted_at?: string | null;
  status?: string;
  last_active?: string | null;
  company?: string;
  widget_settings?: any;
  is_error?: boolean;
  error_message?: string;
}

export interface ClientFormData {
  client_name: string;
  email: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  agent_name?: string;
  company?: string;
  description?: string;
  _tempLogoFile?: File | null;
  logo_url?: string;
  logo_storage_path?: string;
}

// Updated WebsiteUrl to match the expected type
export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  created_at: string;
  last_crawled: string | null;
  refresh_rate: number | null;
  status: "pending" | "processing" | "completed" | "failed" | null;
  notified_at?: string | null;
}

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  created_at: string;
  document_type: string | null;
  access_status: AccessStatus | null;
  notified_at: string | null;
  refresh_rate: number | null;
}

export type AccessStatus = 'granted' | 'pending' | 'denied';
