
import { WidgetSettings } from '@/types/widget-settings';
import { Json } from '@/integrations/supabase/types';

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';

// Define the client interface
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
  deletion_scheduled_at: string | null;
  deleted_at: string | null;
  status: 'active' | 'inactive' | 'deleted';
  agent_name: string;
  agent_description?: string;
  last_active: string | null;
  widget_settings: WidgetSettings;
  name: string;
  is_error: boolean;
}

// Define the client activity interface
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Define the document link interface
export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: string;
  created_at: string;
  refresh_rate: number;
  notified_at?: string;
  access_status?: AccessStatus;
}

// Define activity type to match with those in client-form.ts
export type ActivityType = 
  | 'client_created'
  | 'client_updated' 
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'url_deleted'  // Added for backward compatibility
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_uploaded'
  | 'document_processed'
  | 'document_processing_failed'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'chat_interaction'
  | 'agent_name_updated'
  | 'agent_logo_updated'
  | 'agent_description_updated'
  | 'ai_agent_created'
  | 'ai_agent_updated'
  | 'error_logged'
  | 'webhook_sent'
  | 'system_update'
  | 'common_query_milestone'
  | 'interaction_milestone'
  | 'growth_milestone'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'logo_uploaded'
  | 'embed_code_copied'
  | 'source_added'
  | 'source_deleted'
  | 'ai_agent_table_created'
  | 'signed_out'
  | 'email_sent'
  | 'openai_assistant_document_added';

// For an individual client dashboard
export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: { query: string; count: number }[];
  success_rate: number;
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: { query: string; count: number }[];
  successRate: number;
}

export interface ChatInteraction {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  sentiment?: string;
  user_id?: string;
  session_id?: string;
}

// For activity dashboards
export interface Activity {
  id: string;
  client_id: string;
  client_name?: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}
