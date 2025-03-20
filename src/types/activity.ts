
import { Json } from "@/integrations/supabase/types";

// Standard activity types from the database enum
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
  | "invitation_sent"
  | "invitation_accepted"
  | "webhook_sent"
  | "document_stored"
  | "document_processed"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "ai_agent_created"
  | "ai_agent_updated"
  | "logo_uploaded"
  | "system_update"
  | "document_link_added"
  | "document_link_deleted"
  | "document_uploaded"
  | "signed_out"
  | "embed_code_copied"
  | "widget_previewed"
  | "email_sent";

// Extended activity types for additional client activities
export type ExtendedActivityType = ActivityType 
  | "agent_name_updated" 
  | "error_logged"
  | "agent_error";

export interface Activity {
  id: string;
  created_at: string;
  client_id: string;
  activity_type: ExtendedActivityType;
  description: string;
  metadata: Json;
  is_read: boolean;
}

// Client status types - include "deleted" status
export type ClientStatus = "active" | "inactive" | "deleted";
