
import { ActivityType } from './client-form';
import { Json } from "@/integrations/supabase/types";

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata: Json;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Client status type
export type ClientStatus = 'active' | 'inactive' | 'deleted';
