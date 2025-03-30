
// Define all possible activity types
export enum ActivityType {
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  CLIENT_RECOVERED = 'client_recovered',
  WIDGET_UPDATED = 'widget_updated',
  WEBSITE_URL_ADDED = 'website_url_added',
  URL_DELETED = 'url_deleted',
  DRIVE_LINK_ADDED = 'drive_link_added',
  DRIVE_LINK_DELETED = 'drive_link_deleted',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  SYSTEM_UPDATE = 'system_update',
  WEBHOOK_SENT = 'webhook_sent',
  ERROR_LOGGED = 'error_logged',
  CHAT_INTERACTION = 'chat_interaction',
  WIDGET_SETTINGS_UPDATED = 'widget_settings_updated',
  LOGO_UPLOADED = 'logo_uploaded',
  WIDGET_PREVIEWED = 'widget_previewed',
  PROFILE_UPDATED = 'profile_updated'
}

// Allow string literal types for backward compatibility
export type ActivityTypeString = 
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
