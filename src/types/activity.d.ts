
export enum ActivityType {
  LOGIN = 'login',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  URL_PROCESSED = 'url_processed'
}

export interface ClientActivity {
  id: string;
  client_id: string;
  agent_name?: string | null;
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}
