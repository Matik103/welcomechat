
// This type is now just a string
export type ExtendedActivityType = string;

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: string;
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
