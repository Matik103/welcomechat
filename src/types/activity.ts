
// Use the ActivityType from client-form.ts to ensure consistency
import { ActivityType } from './client-form';

// This is the same as ActivityType, just with a different name for compatibility
// Eventually, we should refactor code to use only ActivityType for consistency
export type ExtendedActivityType = ActivityType;

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata: any;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Client status type
export type ClientStatus = 'active' | 'inactive' | 'deleted';
