
export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  description: string;
  created_at: string;
  metadata: any;
  type?: string;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Client status type as string literals instead of enum
export type ClientStatus = 'active' | 'inactive' | 'deleted';
