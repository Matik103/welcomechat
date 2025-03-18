
import { Json } from "@/integrations/supabase/types";
import { Database } from "@/integrations/supabase/types";

// Use the exact type from the Supabase schema
export type ActivityType = Database["public"]["Enums"]["activity_type_enum"];

// Define additional client activity types that may not be in the enum yet
export type ExtendedActivityType = ActivityType | 
  "logo_uploaded" | 
  "embed_code_copied" | 
  "widget_previewed" | 
  "ai_agent_created" | 
  "ai_agent_updated" | 
  "signed_out" | 
  "document_link_added" | 
  "document_uploaded" | 
  "document_link_deleted";

export interface ActivityRecord {
  activity_type: ExtendedActivityType;
  description: string;
  client_id?: string;
  metadata?: Json;
}
