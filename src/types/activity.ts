
// Define activity types for the application
export type ActivityType = 
  | 'chat_interaction'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'document_uploaded'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'openai_assistant_document_added'
  | 'openai_assistant_upload_failed'
  | 'schema_update'
  | 'password_reset'
  | 'login_success'
  | 'login_failed'
  | 'widget_updated'
  | 'client_activated'
  | 'client_deactivated'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'signed_out'
  | 'embed_code_copied'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'document_processed'
  | 'client_recovered'
  | 'stats_accessed';

// Define extended activity types (legacy/deprecated)
export type ExtendedActivityType = ActivityType;

// Activity data with client info
export interface ActivityWithClientInfo {
  id: string;
  activity_type: ActivityType;
  description?: string;
  created_at: string;
  client_id?: string;
  client_name?: string;
  metadata?: Record<string, any>;
}

// Activity log entry format
export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  clientId?: string;
  clientName?: string;
  metadata?: Record<string, any>;
}

// Backwards compatibility type mapping for database
export const ActivityTypeMap: Record<string, ActivityType> = {
  'chat_interaction': 'chat_interaction',
  'client_created': 'client_created',
  'client_updated': 'client_updated',
  'client_deleted': 'client_deleted',
  'document_uploaded': 'document_uploaded',
  'document_processing_started': 'document_processing_started',
  'document_processing_completed': 'document_processing_completed',
  'document_processing_failed': 'document_processing_failed',
  'openai_assistant_document_added': 'openai_assistant_document_added',
  'openai_assistant_upload_failed': 'openai_assistant_upload_failed',
  'schema_update': 'schema_update',
  'password_reset': 'password_reset',
  'login_success': 'login_success',
  'login_failed': 'login_failed',
  'widget_updated': 'widget_updated',
  'client_activated': 'client_activated',
  'client_deactivated': 'client_deactivated',
  'document_link_added': 'document_link_added',
  'document_link_deleted': 'document_link_deleted',
  'signed_out': 'signed_out',
  'embed_code_copied': 'embed_code_copied',
  'widget_settings_updated': 'widget_settings_updated',
  'logo_uploaded': 'logo_uploaded',
  'document_processed': 'document_processed',
  'client_recovered': 'client_recovered',
  'stats_accessed': 'stats_accessed'
};
