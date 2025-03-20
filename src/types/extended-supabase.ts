
import { Json } from "@/integrations/supabase/types";

/**
 * Extended activity types for client activities
 */
export type ExtendedActivityType =
  | "chat_interaction"
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "client_recovered"
  | "widget_settings_updated"
  | "website_url_added"
  | "website_url_deleted"
  | "website_url_processed"
  | "drive_link_added"
  | "drive_link_deleted"
  | "document_link_added"
  | "document_link_deleted"
  | "document_uploaded"
  | "document_processed"
  | "document_stored"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "error_logged"
  | "common_query_milestone"
  | "interaction_milestone"
  | "growth_milestone"
  | "webhook_sent"
  | "ai_agent_created"
  | "agent_name_updated"
  | "signed_out"
  | "embed_code_copied"
  | "logo_uploaded"
  | "system_update"
  | "source_deleted"
  | "source_added"
  | "email_sent"; // Added email_sent activity type

/**
 * Access status type for document links
 */
export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown';

/**
 * Extended interface for chat interactions
 */
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

/**
 * Interface to define dashboard stats more clearly
 */
export interface DashboardStats {
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  successRate?: number;
  topQueries: Array<{query_text: string; frequency: number}>;
}
