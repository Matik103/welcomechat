
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "./extended-supabase";

/**
 * Type definition for activity types
 */
export type ActivityType = ExtendedActivityType;

/**
 * Interface for client activity
 */
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
}

/**
 * Interface for activity log props
 */
export interface ActivityLogProps {
  activities: ClientActivity[];
  isLoading: boolean;
}

/**
 * Interface for activity item props
 */
export interface ActivityItemProps {
  activity: ClientActivity;
}
