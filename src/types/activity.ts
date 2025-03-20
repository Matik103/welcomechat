
// This file defines activity types for client activities

import { Json } from "@/integrations/supabase/types";

export type ClientStatus = "active" | "inactive" | "deleted";

export type ActivityType = 
  | "chat_interaction" 
  | "client_created" 
  | "client_updated" 
  | "client_deleted" 
  | "client_recovered"
  | "widget_settings_updated"
  | "website_url_added"
  | "drive_link_added"
  | "url_deleted"
  | "drive_link_deleted"
  | "logo_uploaded"
  | "source_added"
  | "source_deleted"
  | "email_sent"
  | "system_update"
  | "ai_agent_created"
  | "ai_agent_updated"
  | "agent_name_updated"
  | "agent_error"
  | "error_logged"
  | "interaction_milestone"
  | "common_query_milestone"
  | "growth_milestone"
  | "invitation_sent"
  | "invitation_accepted"
  | "webhook_sent"
  | "widget_previewed"
  | "document_link_added"
  | "document_link_deleted"
  | "document_uploaded"
  | "document_stored"
  | "document_processed"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "signed_out"
  | "embed_code_copied"
  | "ai_agent_table_created";

// Extended activity types that include all possible types used in the application
export type ExtendedActivityType = ActivityType;

export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
}
