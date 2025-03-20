/**
 * Extended types for the client application
 */

import { Json } from "@/integrations/supabase/types";

export interface Client {
  id: string;
  client_name: string;
  email: string;
  logo_url?: string;
  logo_storage_path?: string;
  created_at: string;
  updated_at: string;
  deletion_scheduled_at?: string;
  deleted_at?: string;
  status: string;
  company?: string;
  description?: string;
  widget_settings: WidgetSettings;
  name?: string; // This is the agent_name
  agent_name?: string; // Adding this field to match what's expected
  last_active?: string; // Adding this field to fix ClientList errors
}

export interface WidgetSettings {
  agent_name?: string;
  agent_description?: string;
  logo_url?: string;
  logo_storage_path?: string;
  welcome_text?: string;
  chat_color?: string;
  background_color?: string;
  text_color?: string;
  secondary_color?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  response_time_text?: string;
}

export interface ClientFormData {
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  widget_settings?: WidgetSettings;
  _tempLogoFile?: File;
}

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  created_at: string;
  document_type: string;
  access_status?: AccessStatus;
  notified_at?: string;
}

export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at: string;
}

// Add this missing type for drive links
export type DriveLink = DocumentLink;

// Define AccessStatus type for document links
export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown';

// Define ChatInteraction interface for consistent chat history data
export interface ChatInteraction {
  id: string;
  clientId: string;
  timestamp: string;
  query: string;
  response: string;
  agentName?: string;
  responseTimeMs?: number;
  metadata?: Json;
}

// Extended ActivityType
export type ActivityType =
  | 'chat_interaction'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'website_url_processed'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_uploaded'
  | 'document_processed'
  | 'document_stored'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'error_logged'
  | 'common_query_milestone'
  | 'interaction_milestone'
  | 'growth_milestone'
  | 'webhook_sent'
  | 'ai_agent_created'
  | 'agent_name_updated'
  | 'signed_out'
  | 'embed_code_copied'
  | 'logo_uploaded'
  | 'system_update'
  | 'source_deleted'
  | 'source_added';

// Add missing ClientDetailsProps interface
export interface ClientDetailsProps {
  client: any;
  clientId: string;
  isClientView: boolean;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: any) => Promise<any>;
}
