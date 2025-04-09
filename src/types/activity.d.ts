
export enum ActivityType {
  // Client activities
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  
  // Document operations
  DOCUMENT_ADDED = 'DOCUMENT_ADDED',
  DOCUMENT_REMOVED = 'DOCUMENT_REMOVED',
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  
  // URL operations
  URL_ADDED = 'URL_ADDED',
  URL_REMOVED = 'URL_REMOVED',
  URL_PROCESSED = 'URL_PROCESSED',
  
  // Agent operations
  AGENT_CREATED = 'AGENT_CREATED',
  AGENT_UPDATED = 'AGENT_UPDATED',
  AGENT_DELETED = 'AGENT_DELETED',
  
  // Interaction operations
  INTERACTION_STARTED = 'INTERACTION_STARTED',
  INTERACTION_COMPLETED = 'INTERACTION_COMPLETED',
  
  // Generic operations
  SETTING_UPDATED = 'SETTING_UPDATED',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
  USER_ACTION = 'USER_ACTION'
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
