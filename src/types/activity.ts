
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

// Adding string literal type for backward compatibility
export type ActivityTypeString = 
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DELETED'
  | 'DOCUMENT_ADDED'
  | 'DOCUMENT_REMOVED'
  | 'DOCUMENT_PROCESSED'
  | 'URL_ADDED'
  | 'URL_REMOVED'
  | 'URL_PROCESSED'
  | 'AGENT_CREATED'
  | 'AGENT_UPDATED'
  | 'AGENT_DELETED'
  | 'INTERACTION_STARTED'
  | 'INTERACTION_COMPLETED'
  | 'SETTING_UPDATED'
  | 'SYSTEM_ACTION'
  | 'USER_ACTION'
  | 'agent_created' // Lowercase variants for compatibility
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_updated'
  | 'website_url_added'
  | 'url_deleted'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'system_update'
  | 'webhook_sent'
  | 'error_logged'
  | 'chat_interaction'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'widget_previewed'
  | 'profile_updated';

export interface Activity {
  id: string;
  user_id?: string;
  client_id?: string;
  agent_id?: string;
  document_id?: string;
  activity_type: ActivityType;
  created_at: string;
  activity_data?: Record<string, any>;
  agent_name?: string;
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

export interface ActivityRequest {
  activity_type: ActivityType | ActivityTypeString;
  client_id: string;
  user_id?: string;
  agent_id?: string;
  document_id?: string;
  activity_data?: Record<string, any>;
  agent_name?: string;
}
