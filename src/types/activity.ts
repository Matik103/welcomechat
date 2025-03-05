
import { Json } from "@/integrations/supabase/types";
import { Database } from "@/integrations/supabase/types";

// Use the exact type from the Supabase schema
export type ActivityType = Database["public"]["Enums"]["activity_type_enum"] | 
  "logo_uploaded" | 
  "embed_code_copied" | 
  "widget_previewed" | 
  "settings_viewed" | 
  "dashboard_visited" |
  "client_login";

export interface ActivityRecord {
  activity_type: ActivityType;
  description: string;
  client_id?: string;
  metadata?: Json;
}
