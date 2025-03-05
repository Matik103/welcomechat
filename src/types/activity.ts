
import { Json } from "@/integrations/supabase/types";

export type ActivityType = 
  | "client_created" 
  | "client_updated" 
  | "client_deleted" 
  | "client_recovered" 
  | "widget_settings_updated" 
  | "website_url_added" 
  | "drive_link_added" 
  | "url_deleted"
  | "source_added"
  | "source_deleted"
  | "agent_name_updated"
  | "drive_link_deleted"
  | "error_logged"
  | "interaction_milestone"
  | "common_query_milestone"
  | "growth_milestone"
  | "chat_interaction" 
  | "ai_agent_table_created"
  | "logo_uploaded"
  | "embed_code_copied"
  | "widget_previewed";

export interface ActivityRecord {
  activity_type: ActivityType;
  description: string;
  client_id?: string;
  metadata?: Json;
}
