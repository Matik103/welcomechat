
import { ActivityType } from '@/types/activity';

export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ClientActivityWithName extends ClientActivity {
  client_name: string;
}
