
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
  | "agent_description_updated"
  | "document_link_deleted"
  | "signed_out"
  | "embed_code_copied"
  | "stats_accessed"
  | "widget_settings_updated"
  | "logo_uploaded";

// Extended activity types for compatibility
export type ExtendedActivityType = ActivityType | 
  "client_settings_updated" | 
  "client_logo_updated" | 
  "client_logo_removed";

// Map for activity type descriptions
export const ActivityTypeMap: Record<ActivityType, string> = {
  client_created: "Client Created",
  client_updated: "Client Updated",
  client_deleted: "Client Deleted",
  document_uploaded: "Document Uploaded",
  document_processing_started: "Document Processing Started",
  document_processing_completed: "Document Processing Completed",
  document_processing_failed: "Document Processing Failed",
  openai_assistant_document_added: "OpenAI Assistant Document Added",
  openai_assistant_upload_failed: "OpenAI Assistant Upload Failed",
  chat_interaction: "Chat Interaction",
  schema_update: "Schema Update",
  website_url_added: "Website URL Added",
  document_link_added: "Document Link Added",
  agent_name_updated: "Agent Name Updated",
  agent_description_updated: "Agent Description Updated",
  document_link_deleted: "Document Link Deleted",
  signed_out: "Signed Out",
  embed_code_copied: "Embed Code Copied",
  stats_accessed: "Stats Accessed",
  widget_settings_updated: "Widget Settings Updated",
  logo_uploaded: "Logo Uploaded"
};

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
