
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
  | "ai_agent_created"
  | "ai_agent_updated"
  | "logo_uploaded"
  | "system_update";

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
