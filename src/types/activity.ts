
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
  | 'url_deleted';

// Extended activity types used internally
export type ExtendedActivityType = 
  | ActivityType
  | 'widget_settings_updated'
  | 'agent_name_updated'
  | 'error_logged';
