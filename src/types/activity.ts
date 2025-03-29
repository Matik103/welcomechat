
export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  description: string;
  created_at: string;
  metadata: any;
  type?: string;
  ai_agent_id?: string; // Added for compatibility with activities table
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Define a safer set of activity types that matches the database enum
export enum ActivityType {
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  URL_PROCESSED = 'url_processed',
  URL_PROCESSING_FAILED = 'url_processing_failed',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED = 'chat_message_received',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_RECOVERED = 'client_recovered',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  AGENT_NAME_UPDATED = 'agent_name_updated',
  AGENT_DESCRIPTION_UPDATED = 'agent_description_updated',
  AGENT_ERROR = 'agent_error',
  AGENT_LOGO_UPDATED = 'agent_logo_updated',
  WEBHOOK_SENT = 'webhook_sent',
  EMAIL_SENT = 'email_sent',
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  WIDGET_PREVIEWED = 'widget_previewed',
  USER_ROLE_UPDATED = 'user_role_updated',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  SIGNED_OUT = 'signed_out',
  WIDGET_SETTINGS_UPDATED = 'widget_settings_updated',
  LOGO_UPLOADED = 'logo_uploaded',
  SYSTEM_UPDATE = 'system_update',
  SOURCE_DELETED = 'source_deleted',
  SOURCE_ADDED = 'source_added',
  ERROR_LOGGED = 'error_logged'
}

// Also export type for type checking
export type ActivityTypeString = 
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'document_processing_failed'
  | 'url_added'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'agent_name_updated'
  | 'agent_description_updated'
  | 'agent_error'
  | 'agent_logo_updated'
  | 'webhook_sent'
  | 'email_sent'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'widget_previewed'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'signed_out'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'system_update'
  | 'source_deleted'
  | 'source_added'
  | 'error_logged';
