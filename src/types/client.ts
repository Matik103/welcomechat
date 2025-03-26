
import { Json } from '@/integrations/supabase/types';
import { ActivityType } from './client-form';

export interface Client {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  last_active: string | null;
  logo_url: string;
  logo_storage_path: string;
  agent_name: string;
  agent_description: string;
  widget_settings: Record<string, any>;
  // Adding name field for backward compatibility
  name?: string;
  is_error?: boolean;
  user_id?: string; // Added for compatibility
}

// Export these types from client-dashboard.ts to avoid circular dependencies
export interface ErrorLog {
  id: string;
  client_id?: string;
  error_type: string;
  message: string;
  created_at?: string;
  status?: 'pending' | 'resolved' | 'in_progress';
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  created_at?: string;
}

export interface ChatInteraction {
  id: string;
  client_id: string;
  query_text: string;
  response_text: string;
  created_at: string;
  agent_name?: string;
  response_time_ms?: number;
}

export interface ClientActivity {
  id: string;
  client_id?: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: { query_text: string; frequency: number }[];
  success_rate?: number;
  
  // CamelCase variants for frontend compatibility
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: { query_text: string; frequency: number }[];
  successRate?: number;
}

export interface WebsiteUrl {
  id: number;
  url: string;
  client_id: string;
  created_at: string;
  status?: "pending" | "processing" | "failed" | "completed";
  refresh_rate: number;
  notified_at?: string;
  last_crawled?: string;
}

export interface DocumentLink {
  id: number;
  link: string;
  client_id: string;
  created_at: string;
  document_type: string;
  access_status?: AccessStatus;
  refresh_rate: number;
  notified_at?: string;
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending';

// Define the types that should be imported from client-form.ts
export type { ClientFormData, ActivityType, WidgetSettings } from './client-form';
