import { Json } from './supabase-types';
import { Database } from "@/integrations/supabase/types";

// Use the exact type from the Supabase schema
export type ActivityType = Database["public"]["Enums"]["activity_type_enum"];

// Define additional client activity types that may not be in the enum yet
export type ExtendedActivityType = 
  | 'login'
  | 'logout'
  | 'update_profile'
  | 'update_settings'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'send_invitation'
  | 'access_resource'
  | 'update_resource'
  | 'chat_interaction';

export interface ActivityRecord {
  activity_type: ExtendedActivityType;
  description: string;
  client_id?: string;
  metadata?: Json;
}

export interface ActivityLogEntry {
  id: string;
  client_id: string;
  activity_type: ExtendedActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
}
