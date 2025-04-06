
// Client related types
import { User } from '@supabase/supabase-js';
import { DocumentType, AccessStatus } from './document-processing';

export interface ClientData {
  id: string;
  client_name: string;
  email: string;
  company?: string;
  agent_name?: string;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;
  logo_storage_path?: string;
  widget_settings?: Record<string, any>;
  status?: 'active' | 'inactive' | 'pending';
  last_active?: string;
}

export interface ClientStats {
  interactions: number;
  topics: number;
  errors: number;
  interactions_24h: number;
  interactions_7d: number;
  unique_users: number;
}

export interface ClientFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ClientOption {
  value: string;
  label: string;
}

// Export Client interface from client.d.ts to ensure compatibility
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
}
