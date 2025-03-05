
import { Json } from "@/integrations/supabase/types";

export type ActivityType = 
  | "client_created" 
  | "client_updated" 
  | "client_deleted" 
  | "client_recovered" 
  | "widget_settings_updated" 
  | "website_url_added" 
  | "drive_link_added" 
  | "website_url_removed" 
  | "drive_link_removed" 
  | "logo_uploaded" 
  | "embed_code_copied" 
  | "widget_previewed" 
  | "chat_interaction" 
  | "ai_agent_table_created";

export interface ActivityRecord {
  activity_type: ActivityType;
  description: string;
  client_id?: string;
  metadata?: Json;
}
