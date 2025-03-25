
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
  | 'client_login'
  | 'client_password_reset'
  | 'client_chat_interaction'
  | 'chat_interaction'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'website_url_added'
  | 'website_url_validated'
  | 'website_url_scraping_started'
  | 'website_url_scraping_completed'
  | 'website_url_scraping_failed';

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
