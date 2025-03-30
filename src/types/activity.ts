
// Define all possible activity types
export enum ActivityType {
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_RECOVERED = 'client_recovered',
  WIDGET_UPDATED = 'widget_updated',
  WEBSITE_URL_ADDED = 'website_url_added',
  URL_ADDED = 'url_added',
  URL_DELETED = 'url_deleted',
  URL_REMOVED = 'url_removed',
  URL_PROCESSED = 'url_processed',
  URL_PROCESSING_FAILED = 'url_processing_failed',
  DRIVE_LINK_ADDED = 'drive_link_added',
  DRIVE_LINK_DELETED = 'drive_link_deleted',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
  SYSTEM_UPDATE = 'system_update',
  WEBHOOK_SENT = 'webhook_sent',
  ERROR_LOGGED = 'error_logged',
  CHAT_INTERACTION = 'chat_interaction',
  WIDGET_SETTINGS_UPDATED = 'widget_settings_updated',
  LOGO_UPLOADED = 'logo_uploaded',
  WIDGET_PREVIEWED = 'widget_previewed',
  PROFILE_UPDATED = 'profile_updated',
  EMAIL_SENT = 'email_sent',
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  USER_ROLE_UPDATED = 'user_role_updated',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  SIGNED_OUT = 'signed_out',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  AGENT_NAME_UPDATED = 'agent_name_updated',
  AGENT_DESCRIPTION_UPDATED = 'agent_description_updated',
  AGENT_ERROR = 'agent_error',
  AGENT_LOGO_UPDATED = 'agent_logo_updated',
  SOURCE_ADDED = 'source_added',
  SOURCE_DELETED = 'source_deleted'
}

// Allow string literal types for backward compatibility
export type ActivityTypeString = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_updated'
  | 'website_url_added'
  | 'url_added'
  | 'url_deleted'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'document_processing_failed'
  | 'system_update'
  | 'webhook_sent'
  | 'error_logged'
  | 'chat_interaction'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'widget_previewed'
  | 'profile_updated'
  | 'email_sent'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'signed_out'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'agent_name_updated'
  | 'agent_description_updated'
  | 'agent_error'
  | 'agent_logo_updated'
  | 'source_added'
  | 'source_deleted';

// Export ClientActivity interface here to resolve import errors
export interface ClientActivity {
  id: string;
  client_id?: string;
  type: ActivityType | ActivityTypeString;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}
