
/**
 * Defines the allowed activity types for the client_activities table.
 * These values are enforced by database constraints.
 */
export type ActivityType = 
  | 'document_uploaded'  
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'openai_assistant_document_added'
  | 'openai_assistant_upload_failed'
  | 'schema_update'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'drive_link_added'
  | 'url_deleted'
  | 'source_added'
  | 'source_deleted'
  | 'agent_name_updated'
  | 'drive_link_deleted'
  | 'error_logged'
  | 'interaction_milestone'
  | 'common_query_milestone'
  | 'growth_milestone'
  | 'ai_agent_table_created'
  | 'ai_agent_created'
  | 'ai_agent_updated'
  | 'document_stored'
  | 'document_processed'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'signed_out'
  | 'embed_code_copied'
  | 'widget_previewed'
  | 'chat_interaction';

/**
 * Extended activity type includes custom types not enforced by the database
 * but used by the application for more specific logging needs.
 */
export type ExtendedActivityType = ActivityType | string;

/**
 * Activity data structure representing a client activity record
 */
export interface Activity {
  id?: string;
  client_id?: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Extended activity interface that includes client information
 * Used for displaying activities with context about the related client
 */
export interface ActivityWithClientInfo extends Activity {
  client_name?: string;
  client_email?: string;
  agent_name?: string;
}
