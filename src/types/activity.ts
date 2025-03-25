
import { Json } from "@/integrations/supabase/types";

// Define valid activity types
export type ActivityType = 
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "document_uploaded"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "openai_assistant_document_added"
  | "openai_assistant_upload_failed"
  | "chat_interaction"
  | "schema_update"
  | "website_url_added"
  | "document_link_added"
  | "agent_name_updated"
  | "agent_description_updated";

// Extended activity types for compatibility
export type ExtendedActivityType = ActivityType | 
  "client_settings_updated" | 
  "client_logo_updated" | 
  "client_logo_removed";

// Define activity log entry structure
export interface ActivityLogEntry {
  id: string;
  activity_type: ActivityType;
  created_at: string;
  client_id?: string;
  client_name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Activity with client information
export interface ActivityWithClientInfo extends ActivityLogEntry {
  client_name: string;
}
