
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

export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Define a safer set of activity types that avoids collisions with database enum
export type ActivityType = 
  | 'chat_interaction'
  | 'client_created' 
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'ai_agent_created'
  | 'ai_agent_updated'
  | 'ai_agent_deleted'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_uploaded'
  | 'login_success'
  | 'login_failed'
  | 'error_logged';

// This approach prevents us from trying to use potentially invalid enum values
// by entirely avoiding database inserts for activities
