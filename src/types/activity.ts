
export type ClientStatus = 'active' | 'inactive' | 'deleted';

export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'webhook_sent'
  | 'email_sent'
  | 'system_update'
  | 'ai_agent_created'
  | 'ai_agent_updated'
  | 'chat_interaction'
  | 'agent_error'
  | 'schema_update'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'website_url_added'
  | 'url_deleted'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_uploaded'
  | 'signed_out'
  | 'embed_code_copied'
  | 'widget_previewed'
  | 'logo_uploaded'
  | 'document_stored'
  | 'document_processed'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'invitation_sent'
  | 'invitation_accepted';

// Extended activity types used internally
export type ExtendedActivityType = 
  | ActivityType
  | 'widget_settings_updated'
  | 'agent_name_updated'
  | 'error_logged';
