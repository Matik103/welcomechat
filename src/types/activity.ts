// Define ActivityType as both an enum and a type for better TypeScript support
export enum ActivityType {
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  AGENT_CREATED = 'agent_created',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

// Also keep the type for backward compatibility
export type ActivityTypeString = 
  | 'url_added' 
  | 'url_removed' 
  | 'document_added' 
  | 'document_removed' 
  | 'client_created' 
  | 'client_updated' 
  | 'agent_created'
  | 'login' 
  | 'logout';

// Define ClientActivity type that was referenced but missing
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType | string;
  activity_data: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at?: string;
}
